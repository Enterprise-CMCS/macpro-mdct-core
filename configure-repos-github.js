import { Octokit } from "@octokit/rest";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { loadReposFromConfig } from "./sync-files-common.js";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not set");

const octokit = new Octokit({ auth: GITHUB_TOKEN });

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(ROOT_DIR, "repo-settings.json");

const SEPARATOR_WIDTH = 80;

// TODO: configure all repos when ready
const REPO_CONFIG = (await loadReposFromConfig(true))
  // .filter((repo) => repo.includes("seds") || repo.includes("carts")) // TODO: temp
  .reduce((acc, repo) => {
    acc[repo] = { dryRun: true };
    return acc;
  }, {});

const DEFAULT_BRANCH_PROTECTION = {
  required_status_checks: null,
  enforce_admins: null,
  required_pull_request_reviews: null,
  restrictions: null,
  required_linear_history: false,
  allow_force_pushes: false,
  allow_deletions: false,
  block_creations: false,
  required_conversation_resolution: false,
  lock_branch: false,
  allow_fork_syncing: false,
};

function mergeWithDefaults(rules) {
  return {
    ...DEFAULT_BRANCH_PROTECTION,
    ...rules,
  };
}

async function getProtectedBranches(owner, repoName) {
  const { data: branches } = await octokit.rest.repos.listBranches({
    owner,
    repo: repoName,
    protected: true,
  });
  return branches.map((b) => b.name);
}

async function getEnvironments(owner, repoName) {
  const { data } = await octokit.rest.repos.getAllEnvironments({
    owner,
    repo: repoName,
  });
  return {
    environments: data.environments,
    total_count: data.total_count,
  };
}

async function getEnvironmentDetails(owner, repoName, environmentName) {
  try {
    const { data } = await octokit.rest.repos.getEnvironment({
      owner,
      repo: repoName,
      environment_name: environmentName,
    });
    return data;
  } catch (error) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

const branchProtectionCache = new Map();

async function getCurrentBranchProtection(owner, repoName, branch) {
  const cacheKey = `${owner}/${repoName}/${branch}`;

  if (branchProtectionCache.has(cacheKey)) {
    return branchProtectionCache.get(cacheKey);
  }

  try {
    const { data } = await octokit.rest.repos.getBranchProtection({
      owner,
      repo: repoName,
      branch,
    });
    branchProtectionCache.set(cacheKey, data);
    return data;
  } catch (error) {
    if (error.status === 404) {
      branchProtectionCache.set(cacheKey, null);
      return null;
    }
    throw error;
  }
}

function removeMetadata(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;

  const metadataKeys = new Set([
    "url",
    "id",
    "node_id",
    "avatar_url",
    "gravatar_id",
    "type",
    "site_admin",
    "user_view_type",
  ]);
  const metadataSuffixes = ["_url", "_at"];

  for (const key in obj) {
    if (
      metadataKeys.has(key) ||
      metadataSuffixes.some((suffix) => key.endsWith(suffix))
    ) {
      delete obj[key];
    } else if (Array.isArray(obj[key])) {
      obj[key].forEach((item) => removeMetadata(item));
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      removeMetadata(obj[key]);
    }
  }
}

function convertBranchProtectionToConfig(config) {
  if (!config) return null;

  removeMetadata(config);

  for (const key in config) {
    if (config[key]?.enabled !== undefined) {
      config[key] = config[key].enabled;
    }
  }

  return config;
}

function convertEnvironmentToConfig(config) {
  config.environment_name = config.name;

  removeMetadata(config);

  const nonConfigKeys = ["name", "can_admins_bypass", "protection_rules"];
  nonConfigKeys.forEach((key) => delete config[key]);

  return config;
}

function arraysEqualIgnoringOrder(arr1, arr2) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
  if (arr1.length !== arr2.length) return false;

  const stringify1 = arr1.map((item) => JSON.stringify(item)).sort();
  const stringify2 = arr2.map((item) => JSON.stringify(item)).sort();

  return JSON.stringify(stringify1) === JSON.stringify(stringify2);
}

function findArrayDifferences(current, desired) {
  const currentSet = new Set(current.map((item) => JSON.stringify(item)));
  const desiredSet = new Set(desired.map((item) => JSON.stringify(item)));

  const added = desired
    .filter((item) => !currentSet.has(JSON.stringify(item)))
    .map((item) => JSON.parse(JSON.stringify(item)));

  const removed = current
    .filter((item) => !desiredSet.has(JSON.stringify(item)))
    .map((item) => JSON.parse(JSON.stringify(item)));

  return { added, removed };
}

function compareObjects(current, desired, path = "") {
  const changes = [];
  const allKeys = new Set([
    ...Object.keys(current || {}),
    ...Object.keys(desired || {}),
  ]);

  for (const key of allKeys) {
    const currentVal = current?.[key] ?? null;
    const desiredVal = desired?.[key] ?? null;
    const fullPath = path ? `${path}.${key}` : key;

    if (
      typeof currentVal === "object" &&
      currentVal !== null &&
      typeof desiredVal === "object" &&
      desiredVal !== null &&
      !Array.isArray(currentVal) &&
      !Array.isArray(desiredVal)
    ) {
      changes.push(...compareObjects(currentVal, desiredVal, fullPath));
    } else if (Array.isArray(currentVal) && Array.isArray(desiredVal)) {
      if (!arraysEqualIgnoringOrder(currentVal, desiredVal)) {
        const diff = findArrayDifferences(currentVal, desiredVal);
        changes.push({
          field: fullPath,
          from: currentVal,
          to: desiredVal,
          added: diff.added,
          removed: diff.removed,
        });
      }
    } else if (JSON.stringify(currentVal) !== JSON.stringify(desiredVal)) {
      changes.push({
        field: fullPath,
        from: currentVal,
        to: desiredVal,
      });
    }
  }

  return changes;
}

async function deleteBranchProtection(owner, repoName, branch, dryRun) {
  if (dryRun) {
    console.log(`  [DRY RUN] Would remove protection from branch: ${branch}`);
  } else {
    await octokit.rest.repos.deleteBranchProtection({
      owner,
      repo: repoName,
      branch,
    });
    console.log(`  Removed protection from branch: ${branch}`);
  }
}

async function deleteEnvironment(owner, repoName, environmentName, dryRun) {
  if (dryRun) {
    console.log(`  [DRY RUN] Would delete environment: ${environmentName}`);
  } else {
    await octokit.rest.repos.deleteAnEnvironment({
      owner,
      repo: repoName,
      environment_name: environmentName,
    });
    console.log(`  Deleted environment: ${environmentName}`);
  }
}

function logList(label, items, prefix) {
  console.log(`${label}: ${items.length}`);
  if (items.length > 0) {
    items.forEach((item) => console.log(`  ${prefix} ${item}`));
  }
}

async function configureRepo(repo, dryRun = true) {
  const [owner, repoName] = repo.split("/");

  console.log(`\n${"=".repeat(SEPARATOR_WIDTH)}`);
  console.log(`Repository: ${repo}`);
  if (dryRun) {
    console.log("Mode: DRY RUN - No changes will be applied");
  } else {
    console.log("Mode: LIVE - Changes will be applied");
  }
  console.log(`${"=".repeat(SEPARATOR_WIDTH)}\n`);

  const configContent = await fs.readFile(CONFIG_PATH, "utf8");
  const baseConfig = JSON.parse(configContent);
  const config = {
    branchProtection: {
      ...baseConfig.branchProtection,
      ...baseConfig.overrides?.[repoName]?.branchProtection,
    },
    environments: [
      ...baseConfig.environments,
      ...(baseConfig.overrides?.[repoName]?.environments || []),
    ],
  };

  const currentConfig = {
    branchProtection: {},
    environments: [],
  };

  console.log("BRANCH PROTECTION");
  console.log("-".repeat(SEPARATOR_WIDTH));

  const existingProtectedBranches = await getProtectedBranches(owner, repoName);
  const configuredBranches = config.branchProtection
    ? Object.keys(config.branchProtection)
    : [];

  for (const branch of existingProtectedBranches) {
    const protection = await getCurrentBranchProtection(
      owner,
      repoName,
      branch
    );
    if (protection) {
      currentConfig.branchProtection[branch] =
        convertBranchProtectionToConfig(protection);
    }
  }

  logList("Current", existingProtectedBranches, "-");
  logList("Desired", configuredBranches, "+");
  console.log();

  const existingSet = new Set(existingProtectedBranches);
  const configuredSet = new Set(configuredBranches);

  const branchesToAdd = configuredBranches.filter((b) => !existingSet.has(b));
  const branchesToUpdate = configuredBranches.filter((b) => existingSet.has(b));
  const branchesToRemove = existingProtectedBranches.filter(
    (b) => !configuredSet.has(b)
  );

  if (branchesToAdd.length > 0) {
    logList("Will add protection", branchesToAdd, "+");
  }

  if (branchesToUpdate.length > 0) {
    const branchesWithChanges = [];
    const branchesWithoutChanges = [];

    for (const branch of branchesToUpdate) {
      const mergedRules = mergeWithDefaults(config.branchProtection[branch]);
      const currentProtection = await getCurrentBranchProtection(
        owner,
        repoName,
        branch
      );
      const changes = compareObjects(currentProtection, mergedRules);

      if (changes.length > 0) {
        const changeStrings = changes.map((c) => {
          if (c.added !== undefined || c.removed !== undefined) {
            const parts = [];
            if (c.removed && c.removed.length > 0) {
              parts.push(
                `removed: ${c.removed
                  .map((item) => JSON.stringify(item))
                  .join(", ")}`
              );
            }
            if (c.added && c.added.length > 0) {
              parts.push(
                `added: ${c.added
                  .map((item) => JSON.stringify(item))
                  .join(", ")}`
              );
            }
            return `${c.field}: ${parts.join("; ")}`;
          } else {
            return `${c.field}: ${JSON.stringify(c.from)} -> ${JSON.stringify(
              c.to
            )}`;
          }
        });
        branchesWithChanges.push({ branch, changeStrings });
      } else {
        branchesWithoutChanges.push(branch);
      }
    }

    if (branchesWithChanges.length > 0) {
      console.log(`Will update protection (${branchesWithChanges.length}):`);
      for (const { branch, changeStrings } of branchesWithChanges) {
        logList(
          `  ~ ${branch} (${changeStrings.length} changes)`,
          changeStrings,
          " "
        );
      }
    }

    if (branchesWithoutChanges.length > 0) {
      logList("Already up to date", branchesWithoutChanges, "=");
    }
  }

  if (branchesToRemove.length > 0) {
    logList("Will remove protection", branchesToRemove, "-");
  }

  // for (const branch of branchesToRemove) {
  //   await deleteBranchProtection(owner, repoName, branch, dryRun);
  // }

  if (
    branchesToAdd.length === 0 &&
    branchesToUpdate.length === 0 &&
    branchesToRemove.length === 0
  ) {
    console.log("No changes needed");
  }
  console.log();

  if (configuredBranches.length > 0) {
    for (const [branch, rules] of Object.entries(config.branchProtection)) {
      const mergedRules = mergeWithDefaults(rules);

      if (!dryRun) {
        await octokit.rest.repos.updateBranchProtection({
          owner,
          repo: repoName,
          branch,
          ...mergedRules,
        });
      }
    }
  }

  console.log();

  console.log("ENVIRONMENTS");
  console.log("-".repeat(SEPARATOR_WIDTH));

  const { environments: existingEnvironments } = await getEnvironments(
    owner,
    repoName
  );
  const existingEnvironmentNames = existingEnvironments.map((e) => e.name);
  const configuredEnvironmentNames = config.environments
    ? config.environments.map((e) => e.environment_name)
    : [];

  for (const env of existingEnvironments) {
    const envDetails = await getEnvironmentDetails(owner, repoName, env.name);
    if (envDetails) {
      currentConfig.environments.push(convertEnvironmentToConfig(envDetails));
    }
  }

  logList("Current", existingEnvironmentNames, "-");
  logList("Desired", configuredEnvironmentNames, "+");
  console.log();

  const existingEnvSet = new Set(existingEnvironmentNames);
  const configuredEnvSet = new Set(configuredEnvironmentNames);

  const environmentsToAdd = configuredEnvironmentNames.filter(
    (e) => !existingEnvSet.has(e)
  );
  const environmentsToUpdate = configuredEnvironmentNames.filter((e) =>
    existingEnvSet.has(e)
  );
  const environmentsToRemove = existingEnvironmentNames.filter(
    (e) => !configuredEnvSet.has(e)
  );

  if (environmentsToAdd.length > 0) {
    logList("Will create", environmentsToAdd, "+");
  }

  if (environmentsToUpdate.length > 0) {
    const envsWithChanges = [];
    const envsWithoutChanges = [];

    for (const envName of environmentsToUpdate) {
      const currentEnv = currentConfig.environments.find(
        (e) => e.environment_name === envName
      );
      const desiredEnv = config.environments.find(
        (e) => e.environment_name === envName
      );
      const changes = compareObjects(currentEnv, desiredEnv);

      if (changes.length > 0) {
        const changeStrings = changes.map((c) => {
          if (c.added !== undefined || c.removed !== undefined) {
            const parts = [];
            if (c.removed && c.removed.length > 0) {
              parts.push(
                `removed: ${c.removed
                  .map((item) => JSON.stringify(item))
                  .join(", ")}`
              );
            }
            if (c.added && c.added.length > 0) {
              parts.push(
                `added: ${c.added
                  .map((item) => JSON.stringify(item))
                  .join(", ")}`
              );
            }
            return `${c.field}: ${parts.join("; ")}`;
          } else {
            return `${c.field}: ${JSON.stringify(c.from)} -> ${JSON.stringify(
              c.to
            )}`;
          }
        });
        envsWithChanges.push({ envName, changeStrings });
      } else {
        envsWithoutChanges.push(envName);
      }
    }

    if (envsWithChanges.length > 0) {
      console.log(`Will update (${envsWithChanges.length}):`);
      for (const { envName, changeStrings } of envsWithChanges) {
        logList(
          `  ~ ${envName} (${changeStrings.length} changes)`,
          changeStrings,
          " "
        );
      }
    }

    if (envsWithoutChanges.length > 0) {
      logList("Already up to date", envsWithoutChanges, "=");
    }
  }

  if (environmentsToRemove.length > 0) {
    logList("Will delete", environmentsToRemove, "-");
  }

  // for (const env of environmentsToRemove) {
  //   await deleteEnvironment(owner, repoName, env, dryRun);
  // }

  if (
    environmentsToAdd.length === 0 &&
    environmentsToUpdate.length === 0 &&
    environmentsToRemove.length === 0
  ) {
    console.log("No changes needed");
  }
  console.log();

  if (configuredEnvironmentNames.length > 0) {
    for (const env of config.environments) {
      if (!dryRun) {
        await octokit.rest.repos.createOrUpdateEnvironment({
          owner,
          repo: repoName,
          environment_name: env.environment_name,
          wait_timer: env.wait_timer,
          prevent_self_review: env.prevent_self_review,
          reviewers: env.reviewers,
          deployment_branch_policy: env.deployment_branch_policy,
        });
      }
    }
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "-")
    .replace("Z", "");
  const outputDir = path.join(ROOT_DIR, "config-snapshots");
  await fs.mkdir(outputDir, { recursive: true });

  const outputFilename = `current-config-${repoName}-${timestamp}.json`;
  const outputPath = path.join(outputDir, outputFilename);

  await fs.writeFile(outputPath, JSON.stringify(currentConfig, null, 2));

  console.log(`SUMMARY`);
  console.log("-".repeat(SEPARATOR_WIDTH));
  if (dryRun) {
    console.log(`Dry run completed for ${repo}`);
  } else {
    console.log(`Changes applied for ${repo}`);
  }
  console.log(`Current config exported to: ${outputFilename}`);
  console.log();

  return { repo, configPath: outputPath };
}

async function main() {
  const repos = Object.keys(REPO_CONFIG);

  console.log(`${"=".repeat(SEPARATOR_WIDTH)}`);
  console.log(`REPOSITORY CONFIGURATION`);
  console.log(`${"=".repeat(SEPARATOR_WIDTH)}`);
  console.log(`Total repositories: ${repos.length}\n`);

  const dryRunRepos = repos.filter((repo) => REPO_CONFIG[repo].dryRun);
  const liveRepos = repos.filter((repo) => !REPO_CONFIG[repo].dryRun);

  if (dryRunRepos.length > 0) {
    logList("Dry run mode", dryRunRepos, "-");
  }
  if (liveRepos.length > 0) {
    logList("Live update mode", liveRepos, "-");
  }
  console.log();

  const results = [];
  for (const repo of repos) {
    const dryRun = REPO_CONFIG[repo]?.dryRun ?? true;
    const result = await configureRepo(repo, dryRun);
    results.push(result);
  }

  console.log(`${"=".repeat(SEPARATOR_WIDTH)}`);
  console.log(`CONFIGURATION COMPLETE`);
  console.log(`${"=".repeat(SEPARATOR_WIDTH)}`);
  console.log(`Processed ${repos.length} repositories`);
  const snapshotFiles = results.map((r) => path.basename(r.configPath));
  console.log();
  logList(
    "Current config snapshots saved to: config-snapshots/",
    snapshotFiles,
    "-"
  );
  console.log();
}

main();
