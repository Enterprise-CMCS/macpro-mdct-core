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

/**
 * Default branch protection settings
 * These are used when a setting is not specified in the config
 */
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
  return data.environments.map((e) => e.name);
}

async function removeBranchProtection(owner, repoName, branch) {
  await octokit.rest.repos.deleteBranchProtection({
    owner,
    repo: repoName,
    branch,
  });
  console.log(`  Removed protection from branch: ${branch}`);
}

async function deleteEnvironment(owner, repoName, environmentName) {
  await octokit.rest.repos.deleteAnEnvironment({
    owner,
    repo: repoName,
    environment_name: environmentName,
  });
  console.log(`  Deleted environment: ${environmentName}`);
}

async function configureRepo(repo) {
  const [owner, repoName] = repo.split("/");

  console.log(`\nConfiguring repository: ${repo}`);

  const configPath = CONFIG_PATH;
  console.log(`Loading config from: ${configPath}`);

  const configContent = await fs.readFile(configPath, "utf8");
  const config = JSON.parse(configContent);
  console.log(`Configuration loaded successfully\n`);

  // ========================================
  // CONFIGURE BRANCH PROTECTION RULES
  // ========================================
  console.log("Configuring Branch Protection Rules\n");

  // Get currently protected branches
  const existingProtectedBranches = await getProtectedBranches(owner, repoName);
  const configuredBranches = config.branchProtection
    ? Object.keys(config.branchProtection)
    : [];

  // Configure/update branch protection rules from config
  if (config.branchProtection && configuredBranches.length > 0) {
    for (const [branch, rules] of Object.entries(config.branchProtection)) {
      console.log(`  Protecting branch: ${branch}`);

      // Merge with defaults to ensure all fields are set
      // This ensures that if a setting is removed from config, it reverts to default
      const mergedRules = mergeWithDefaults(rules);

      await octokit.rest.repos.updateBranchProtection({
        owner,
        repo: repoName,
        branch,
        ...mergedRules,
      });

      console.log(`  ${branch} configured successfully`);
    }
  } else {
    console.log("  No branch protection rules found in config");
  }

  // Remove protection from branches not in config
  const branchesToRemove = existingProtectedBranches.filter(
    (branch) => !configuredBranches.includes(branch)
  );

  if (branchesToRemove.length > 0) {
    console.log(
      `\n  Removing protection from branches not in config (${branchesToRemove.length}):`
    );
    for (const branch of branchesToRemove) {
      // TODO: be careful that the config is correct before enabling this
      // await removeBranchProtection(owner, repoName, branch);
      console.log(`  Would remove protection from branch: ${branch}`);
    }
  }
  console.log();

  // ========================================
  // CONFIGURE ENVIRONMENTS
  // ========================================
  console.log("Configuring Environments\n");

  // Get currently configured environments
  const existingEnvironments = await getEnvironments(owner, repoName);
  const configuredEnvironments = config.environments
    ? config.environments.map((e) => e.environment_name)
    : [];

  // Configure/update environments from config
  if (config.environments && config.environments.length > 0) {
    for (const env of config.environments) {
      console.log(`  Configuring environment: ${env.environment_name}`);

      await octokit.rest.repos.createOrUpdateEnvironment({
        owner,
        repo: repoName,
        environment_name: env.environment_name,
        wait_timer: env.wait_timer,
        prevent_self_review: env.prevent_self_review,
        reviewers: env.reviewers,
        deployment_branch_policy: env.deployment_branch_policy,
      });

      console.log(`  ${env.environment_name} configured successfully`);
    }
  } else {
    console.log("  No environments found in config");
  }

  // Remove environments not in config
  const environmentsToRemove = existingEnvironments.filter(
    (env) => !configuredEnvironments.includes(env)
  );

  if (environmentsToRemove.length > 0) {
    console.log(
      `\n  Removing environments not in config (${environmentsToRemove.length}):`
    );
    for (const env of environmentsToRemove) {
      // TODO: be careful that the config is correct before enabling this
      // await deleteEnvironment(owner, repoName, env);
      console.log(`  Would delete environment: ${env}`);
    }
  }
  console.log();

  console.log(`All repository settings applied for ${repo}!`);
}

async function main() {
  // TODO: configure all repos when ready
  // const repos = loadReposFromConfig(CONFIG_PATH);
  const repos = ["Enterprise-CMCS/macpro-mdct-qmr"];

  console.log(`Configuring ${repos.length} repositories...\n`);

  for (const repo of repos) {
    await configureRepo(repo);
  }

  console.log(`\nConfiguration complete for all repositories!`);
}

main();
