/* eslint-disable no-console */

// GITHUB_TOKEN=github_pat_MORE_CHARACTERS node sync-files-github.js
import { Octokit } from "@octokit/rest";
import simpleGit from "simple-git";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import {
  getAllFiles,
  sha256,
  getSyncHash,
  loadReposFromConfig,
} from "./sync-files-common.js";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not set");

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const BRANCH_NAME = "sync-files";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_FILES_DIR = path.join(ROOT_DIR, "files-to-sync");

const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-sync-"));

async function cloneRepo(repo) {
  const dest = path.join(tmpRoot, repo.replace("/", "_"));
  await simpleGit().clone(
    `https://x-access-token:${GITHUB_TOKEN}@github.com/${repo}.git`,
    dest
  );
  return dest;
}

async function syncRepo(repo) {
  const [owner, repoName] = repo.split("/");
  const prs = await octokit.pulls.list({
    owner,
    repo: repoName,
    base: "main",
    state: "open",
  });
  const title = "Sync files managed by macpro-mdct-core";
  const syncPrs = prs.data.filter((pr) => pr.title === title);
  if (syncPrs.length > 0) return;

  const local = await cloneRepo(repo);
  const git = simpleGit(local);

  await git.addConfig("user.name", "Source Files");
  await git.addConfig("user.email", "action@github.com");

  const filesToSync = await getAllFiles(SOURCE_FILES_DIR);
  let changesMade = false;

  for (const relPath of filesToSync) {
    const sourceFile = path.join(SOURCE_FILES_DIR, relPath);
    const targetFile = path.join(local, relPath);

    let differs = false;
    try {
      const [sourceHash, targetHash] = await Promise.all([
        sha256(sourceFile),
        sha256(targetFile),
      ]);
      differs = sourceHash !== targetHash;
    } catch {
      differs = true;
    }

    if (differs) {
      await fs.mkdir(path.dirname(targetFile), { recursive: true });
      await fs.copyFile(sourceFile, targetFile);
      changesMade = true;
    }
  }

  if (changesMade) {
    const syncHash = await getSyncHash(filesToSync, SOURCE_FILES_DIR);
    const branchName = `${BRANCH_NAME}-${syncHash}`;
    await git.checkoutLocalBranch(branchName);
    await git.add(filesToSync);
    await git.commit("sync: update source files");
    await git.push("origin", branchName);

    await octokit.pulls.create({
      owner,
      title,
      repo: repoName,
      head: branchName,
      base: "main",
      body: "# This PR syncs files that have been changed from the standardized version in this folder: https://github.com/Enterprise-CMCS/macpro-mdct-core/tree/main/files-to-sync\n ## If you have a better version you'd like to propogate, please make a PR in macpro-mdct-core so that we can get your idea pushed out to all repos!",
    });
  }
}

async function main() {
  const repos = await loadReposFromConfig(true); // true = keep full path format

  for (const repo of repos) {
    try {
      await syncRepo(repo);
      console.log(`Synced ${repo}`);
    } catch (err) {
      console.error(`Failed to sync ${repo}:`, err);
    }
  }
}

main().catch(console.error);
