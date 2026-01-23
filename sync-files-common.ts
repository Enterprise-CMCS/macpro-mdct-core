/* eslint-disable no-console */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

export async function getAllFiles(
  dir: string,
  baseDir: string = dir
): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      // Skip node_modules and .cdk and .git and .build directories
      if (
        entry.isDirectory() &&
        (entry.name === "node_modules" ||
          entry.name === ".cdk" ||
          entry.name === ".git" ||
          entry.name === ".build")
      ) {
        return [];
      }
      if (entry.isDirectory()) {
        return getAllFiles(fullPath, baseDir);
      } else {
        return [path.relative(baseDir, fullPath)];
      }
    })
  );
  return files.flat();
}

// Calculate SHA256 hash of a file (Returns null if file doesn't exist)
export async function sha256(filePath: string): Promise<string | null> {
  try {
    const data = await fs.readFile(filePath);
    return crypto.createHash("sha256").update(data).digest("hex");
  } catch {
    return null;
  }
}

interface RepoConfig {
  repos: string[];
}

// Load repository list from sync-files-repos.json
export async function loadReposFromConfig(
  fullPath: boolean = false
): Promise<string[]> {
  const configPath = path.join(ROOT_DIR, "sync-files-repos.json");
  const configData = await fs.readFile(configPath, "utf-8");
  const config: RepoConfig = JSON.parse(configData);

  if (fullPath) {
    return config.repos;
  } else {
    // Extract repo names from the full path format (e.g., "Enterprise-CMCS/macpro-mdct-qmr" -> "macpro-mdct-qmr")
    return config.repos.map((repo) => repo.split("/").pop()!);
  }
}

// Calculate a sync hash based on file contents (Used for creating unique branch names)
export async function getSyncHash(
  files: string[],
  sourceFilesDir: string
): Promise<string> {
  const hashes = await Promise.all(
    files.map(async (relPath) => {
      const absPath = path.join(sourceFilesDir, relPath);
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

// Figure out if a file contains the disclaimer indicating it's managed by macpro-mdct-core
export async function checkForDisclaimer(filePath: string): Promise<boolean> {
  const content = await fs.readFile(filePath, "utf-8");
  return content.includes("managed by macpro-mdct-core");
}
