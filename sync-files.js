import { Octokit } from "@octokit/rest";
import simpleGit from "simple-git";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { fileURLToPath } from "url";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not set");

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const BRANCH_NAME = "sync-files";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_FILES_DIR = path.join(ROOT_DIR, "files-to-sync");
const REPOS_FILE = path.join(ROOT_DIR, "sync-files-repos.json");

const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-sync-"));

async function getAllFiles(dir, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return getAllFiles(fullPath, baseDir);
      } else {
        return [path.relative(baseDir, fullPath)];
      }
    })
  );
  return files.flat();
}

async function sha256(filePath) {
  const data = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function getSyncHash(files) {
  const hashes = await Promise.all(
    files.map(async (relPath) => {
      const absPath = path.join(SOURCE_FILES_DIR, relPath);
      const content = await fs.readFile(absPath);
      return crypto
        .createHash("sha256")
        .update(relPath + "\0" + content)
        .digest("hex");
    })
  );
  return crypto
    .createHash("sha256")
    .update(hashes.join(""))
    .digest("hex")
    .slice(0, 8);
}

async function cloneRepo(repo) {
  const dest = path.join(tmpRoot, repo.replace("/", "_"));
  await simpleGit().clone(
    `https://x-access-token:${GITHUB_TOKEN}@github.com/${repo}.git`,
    dest
  );
  return dest;
}

async function syncRepo(repo) {
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
    const syncHash = await getSyncHash(filesToSync);
    const branchName = `${BRANCH_NAME}/${syncHash}`;
    await git.checkoutLocalBranch(branchName);
    await git.add(filesToSync);
    await git.commit("sync: update source files");

    try {
      await git.push("origin", branchName);
    } catch (err) {
      if (
        err.message.includes("non-fast-forward") ||
        err.message.includes("failed to push") ||
        err.message.includes("Updates were rejected")
      ) {
        console.warn(
          `Branch ${branchName} already exists on remote. Skipping push and PR.`
        );
        return;
      } else {
        throw err;
      }
    }

    const [owner, repoName] = repo.split("/");

    const prs = await octokit.pulls.list({
      owner,
      repo: repoName,
      head: `${owner}:${branchName}`,
      state: "open",
    });

    if (prs.data.length === 0) {
      await octokit.pulls.create({
        owner,
        repo: repoName,
        title: "Sync source files",
        head: branchName,
        base: "main",
        body: "This PR syncs files from the source repository.",
      });
    }
  }
}

async function main() {
  const raw = await fs.readFile(REPOS_FILE, "utf8");
  const { repos } = JSON.parse(raw);

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
