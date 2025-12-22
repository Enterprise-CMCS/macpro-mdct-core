/* eslint-disable no-console */

/**
 * Local sync script - copies files to local repos without creating PRs
 * Usage: node sync-files-local.js
 * Or with custom repos: REPOS="carts,qmr" node sync-files-local.js
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getAllFiles,
  sha256,
  loadReposFromConfig,
  checkForDisclaimer,
} from "./sync-files-common.js";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_FILES_DIR = path.join(ROOT_DIR, "files-to-sync");
const PROJECTS_DIR = path.dirname(ROOT_DIR); // Parent directory containing all repos

// Get repos from environment variable or load from config
const reposToSync = process.env.REPOS
  ? process.env.REPOS.split(",").map((r) => `macpro-mdct-${r.trim()}`)
  : await loadReposFromConfig(false); // false = just repo names, not full paths

async function syncLocalRepo(repoName) {
  const targetRepoDir = path.join(PROJECTS_DIR, repoName);

  // Check if repo exists locally
  try {
    await fs.access(targetRepoDir);
  } catch {
    console.log(
      `⚠️  Skipping ${repoName} - directory not found at ${targetRepoDir}`
    );
    return { synced: 0, created: 0, skipped: true };
  }

  const filesToSync = await getAllFiles(SOURCE_FILES_DIR);
  let syncedCount = 0;
  let createdCount = 0;

  for (const relPath of filesToSync) {
    const sourceFile = path.join(SOURCE_FILES_DIR, relPath);
    const targetFile = path.join(targetRepoDir, relPath);

    const [sourceHash, targetHash] = await Promise.all([
      sha256(sourceFile),
      sha256(targetFile),
    ]);

    const differs = sourceHash !== targetHash;
    const isNew = targetHash === null;

    if (differs) {
      await fs.mkdir(path.dirname(targetFile), { recursive: true });
      await fs.copyFile(sourceFile, targetFile);

      if (isNew) {
        createdCount++;
        console.log(`  ✨ Created: ${relPath}`);
      } else {
        syncedCount++;
        console.log(`  ✓ Updated: ${relPath}`);
      }
    }
  }

  // checks for removals in core to apply
  const localFiles = await getAllFiles(targetRepoDir);
  let removedCount = 0;

  for (const relPath of localFiles) {
    const targetFile = path.join(targetRepoDir, relPath);
    const targetSynced = await checkForDisclaimer(targetFile);

    if (!targetSynced) continue;
    const sourceFile = path.join(SOURCE_FILES_DIR, relPath);
    try {
      await fs.access(sourceFile);
    } catch {
      await fs.unlink(targetFile);
      removedCount++;
      console.log(`  ✂ Removed: ${relPath}`);
    }
  }

  return {
    synced: syncedCount,
    created: createdCount,
    removed: removedCount,
    skipped: false,
  };
}

async function main() {
  console.log("🔄 Starting local file sync...\n");
  console.log(`📂 Source: ${SOURCE_FILES_DIR}`);
  console.log(`📂 Target: ${PROJECTS_DIR}\n`);
  console.log(`📋 Repos to sync: ${reposToSync.join(", ")}\n`);

  const results = {};

  for (const repo of reposToSync) {
    console.log(`\n🔍 Syncing ${repo}...`);
    try {
      const result = await syncLocalRepo(repo);
      results[repo] = result;

      if (result.skipped) {
        continue;
      }

      if (result.synced === 0 && result.created === 0) {
        console.log(`  ✓ Already up to date`);
      } else {
        console.log(
          `  ✓ Done: ${result.created} created, ${result.synced} updated`
        );
      }
    } catch (err) {
      console.error(`  ❌ Failed to sync ${repo}:`, err.message);
      results[repo] = { error: err.message };
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary:");
  console.log("=".repeat(60));

  const successful = Object.entries(results).filter(
    ([_, r]) => !r.error && !r.skipped
  );
  const skipped = Object.entries(results).filter(([_, r]) => r.skipped);
  const failed = Object.entries(results).filter(([_, r]) => r.error);

  if (successful.length > 0) {
    console.log(`\n✅ Successfully synced (${successful.length}):`);
    successful.forEach(([repo, result]) => {
      const changes = result.created + result.synced + result.removed;
      const status = changes > 0 ? `${changes} file(s) changed` : "up to date";
      console.log(`   ${repo}: ${status}`);
    });
  }

  if (skipped.length > 0) {
    console.log(`\n⚠️  Skipped (${skipped.length}):`);
    skipped.forEach(([repo, _]) => {
      console.log(`   ${repo}: directory not found`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed (${failed.length}):`);
    failed.forEach(([repo, result]) => {
      console.log(`   ${repo}: ${result.error}`);
    });
  }

  console.log("\n✨ Local sync complete!\n");
}

main().catch(console.error);
