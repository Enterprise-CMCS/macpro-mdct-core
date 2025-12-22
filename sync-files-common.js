/* eslint-disable no-console */

// Common utilities for sync-files scripts
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * Recursively get all files in a directory
 * Filters out node_modules and .cdk directories
 */
export async function getAllFiles(dir, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      // Skip node_modules and .cdk directories
      if (
        entry.isDirectory() &&
        (entry.name === "node_modules" || entry.name === ".cdk")
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

/**
 * Calculate SHA256 hash of a file
 * Returns null if file doesn't exist
 */
export async function sha256(filePath) {
  try {
    const data = await fs.readFile(filePath);
    return crypto.createHash("sha256").update(data).digest("hex");
  } catch {
    return null;
  }
}

/**
 * Load repository list from sync-files-repos.json
 * @param {boolean} fullPath - If true, returns full paths (e.g., "Enterprise-CMCS/repo")
 *                             If false, returns just repo names (e.g., "repo")
 */
export async function loadReposFromConfig(fullPath = false) {
  try {
    const configPath = path.join(ROOT_DIR, "sync-files-repos.json");
    const configData = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(configData);

    if (fullPath) {
      return config.repos;
    } else {
      // Extract repo names from the full path format (e.g., "Enterprise-CMCS/macpro-mdct-qmr" -> "macpro-mdct-qmr")
      return config.repos.map((repo) => repo.split("/").pop());
    }
  } catch (err) {
    console.error(
      "❌ Failed to load repos from sync-files-repos.json:",
      err.message
    );
    process.exit(1);
  }
}

/**
 * Calculate a sync hash based on file contents
 * Used for creating unique branch names
 */
export async function getSyncHash(files, sourceFilesDir) {
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

/**
 * Figure out if a file contains the disclaimer indicating it's managed by macpro-mdct-core
 */
export async function checkForDisclaimer(filePath) {
  const content = await fs.readFile(filePath, "utf-8");
  const firstThreeLines = content.split("\n").slice(0, 3).join("\n");
  return firstThreeLines.includes("managed by macpro-mdct-core");
}
