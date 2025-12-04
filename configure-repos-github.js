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

// TODO: configure all repos when ready
const REPO_CONFIG = (await loadReposFromConfig(true))
  .filter((repo) => repo.includes("seds")) // TODO: temp
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

function formatJson(obj) {
  return JSON.stringify(obj, null, 2).split("\n").join("\n      ");
}

function findItemsToRemove(existingItems, configuredItems) {
  return existingItems.filter((item) => !configuredItems.includes(item));
}

function compareObjects(current, desired, path = "") {
  const changes = [];
  const allKeys = new Set([
    ...Object.keys(current || {}),
    ...Object.keys(desired || {}),
  ]);

  for (const key of allKeys) {
    const currentVal = current?.[key];
    const desiredVal = desired?.[key];
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

async function configureRepo(repo, dryRun = true) {
  const [owner, repoName] = repo.split("/");

  console.log(`\nConfiguring repository: ${repo}`);
  if (dryRun) {
    console.log("  DRY RUN MODE - No changes will be applied");
  }

  console.log(`Loading config from: ${CONFIG_PATH}`);

  const configContent = await fs.readFile(CONFIG_PATH, "utf8");
  const config = JSON.parse(configContent);
  console.log(`Configuration loaded successfully\n`);

  console.log("Configuring Branch Protection Rules\n");

  const existingProtectedBranches = await getProtectedBranches(owner, repoName);
  const configuredBranches = config.branchProtection
    ? Object.keys(config.branchProtection)
    : [];

  console.log(
    `  Current protected branches in repo (${existingProtectedBranches.length}):`
  );
  if (existingProtectedBranches.length > 0) {
    for (const branch of existingProtectedBranches) {
      console.log(`    - ${branch}`);
      const protection = await getCurrentBranchProtection(
        owner,
        repoName,
        branch
      );
      if (protection) {
        console.log(`      Protection settings: ${formatJson(protection)}`);
      }
    }
  } else {
    console.log(`    (none)`);
  }
  console.log();

  if (config.branchProtection && configuredBranches.length > 0) {
    for (const [branch, rules] of Object.entries(config.branchProtection)) {
      console.log(`  Protecting branch: ${branch}`);

      const mergedRules = mergeWithDefaults(rules);
      const currentProtection = await getCurrentBranchProtection(
        owner,
        repoName,
        branch
      );

      if (currentProtection) {
        const changes = compareObjects(currentProtection, mergedRules);
        if (changes.length > 0) {
          console.log(`  Changes detected:`);
          for (const change of changes) {
            console.log(
              `    ${change.field}: ${JSON.stringify(
                change.from
              )} -> ${JSON.stringify(change.to)}`
            );
          }
        } else {
          console.log(`  No changes needed`);
        }
      } else {
        console.log(
          `  Branch ${branch} is currently unprotected - will add protection`
        );
      }

      if (dryRun) {
        console.log(`  [DRY RUN] Would update ${branch} branch protection`);
      } else {
        await octokit.rest.repos.updateBranchProtection({
          owner,
          repo: repoName,
          branch,
          ...mergedRules,
        });
        console.log(`  ${branch} branch protection updated`);
      }
    }
  } else {
    console.log("  No branch protection rules found in config");
  }

  const branchesToRemove = findItemsToRemove(
    existingProtectedBranches,
    configuredBranches
  );

  if (branchesToRemove.length > 0) {
    console.log(
      `\n  Removing protection from branches not in config (${branchesToRemove.length}):`
    );
    for (const branch of branchesToRemove) {
      // TODO: be careful that the config is correct before enabling this
      console.log(`  Would remove protection from branch: ${branch}`);
      // await deleteBranchProtection(owner, repoName, branch, dryRun);
    }
  }
  console.log();

  console.log("Configuring Environments\n");

  const { environments: existingEnvironments, total_count } =
    await getEnvironments(owner, repoName);
  const existingEnvironmentNames = existingEnvironments.map((e) => e.name);
  const configuredEnvironmentNames = config.environments
    ? config.environments.map((e) => e.environment_name)
    : [];

  console.log(`  Current environments in repo (${total_count}):`);
  if (existingEnvironments.length > 0) {
    for (const env of existingEnvironments) {
      console.log(`    - ${env.name}`);
      console.log(`      Settings: ${formatJson(env)}`);
    }
  } else {
    console.log(`    (none)`);
  }
  console.log();

  if (config.environments && config.environments.length > 0) {
    for (const env of config.environments) {
      console.log(`  Configuring environment: ${env.environment_name}`);

      const isNew = !existingEnvironmentNames.includes(env.environment_name);
      if (isNew) {
        console.log(`  Environment does not exist - will create`);
      } else {
        console.log(`  Environment exists - will update`);
      }

      if (dryRun) {
        console.log(
          `  [DRY RUN] Would ${isNew ? "create" : "update"} environment ${
            env.environment_name
          }`
        );
      } else {
        await octokit.rest.repos.createOrUpdateEnvironment({
          owner,
          repo: repoName,
          environment_name: env.environment_name,
          wait_timer: env.wait_timer,
          prevent_self_review: env.prevent_self_review,
          reviewers: env.reviewers,
          deployment_branch_policy: env.deployment_branch_policy,
        });

        console.log(
          `  Environment ${env.environment_name} ${
            isNew ? "created" : "updated"
          }`
        );
      }
    }
  } else {
    console.log("  No environments found in config");
  }

  const environmentsToRemove = findItemsToRemove(
    existingEnvironmentNames,
    configuredEnvironmentNames
  );

  if (environmentsToRemove.length > 0) {
    console.log(
      `\n  Removing environments not in config (${environmentsToRemove.length}):`
    );
    for (const env of environmentsToRemove) {
      // TODO: be careful that the config is correct before enabling this
      console.log(`  Would delete environment: ${env}`);
      // await deleteEnvironment(owner, repoName, env, dryRun);
    }
  }
  console.log();

  if (dryRun) {
    console.log(`[DRY RUN] Completed analysis for ${repo}`);
  } else {
    console.log(`All repository settings applied for ${repo}`);
  }
}

async function main() {
  const repos = Object.keys(REPO_CONFIG);

  console.log(`Configuring ${repos.length} repositories...\n`);

  const dryRunRepos = repos.filter((repo) => REPO_CONFIG[repo].dryRun);
  const liveRepos = repos.filter((repo) => !REPO_CONFIG[repo].dryRun);

  if (dryRunRepos.length > 0) {
    console.log(`Dry run mode: ${dryRunRepos.length} repos`);
    dryRunRepos.forEach((repo) => console.log(`  - ${repo}`));
  }
  if (liveRepos.length > 0) {
    console.log(`Live update mode: ${liveRepos.length} repos`);
    liveRepos.forEach((repo) => console.log(`  - ${repo}`));
  }
  console.log();

  for (const repo of repos) {
    const dryRun = REPO_CONFIG[repo]?.dryRun ?? true;
    await configureRepo(repo, dryRun);
  }

  console.log(`\nConfiguration complete for all repositories`);
}

main();
