// This file is managed by macpro-mdct-core so if you'd like to change it let's do it there
import { runCommand } from "../lib/runner.js";
import { readdir } from "fs/promises";
import { join } from "path";

const findPackageJsonDirs = async (dir: string = "."): Promise<string[]> => {
  const results: string[] = [];

  const scan = async (currentDir: string) => {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Skip these directories entirely
        if (entry.name === "node_modules" || entry.name === ".cdk") {
          continue;
        }
        await scan(join(currentDir, entry.name));
      } else if (entry.name.toLowerCase() === "package.json") {
        results.push(currentDir);
      }
    }
  };

  await scan(dir);
  return results;
};

const directories = await findPackageJsonDirs();

export const installDeps = async () => {
  for (const dir of directories) {
    await runCommand(
      `yarn install ${dir}`,
      ["yarn", "--silent", "install", "--frozen-lockfile"],
      dir,
      { quiet: true }
    );
  }
};

export const install = {
  command: "install",
  describe: "install all project dependencies",
  handler: async () => {},
};
