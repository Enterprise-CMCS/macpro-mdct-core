import { runCommand } from "../lib/runner.js";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const directories = readdirSync("services", { withFileTypes: true })
  .filter(
    (d) =>
      d.isDirectory() &&
      existsSync(path.join("services", d.name, "package.json"))
  )
  .map((d) => `./services/${d.name}`)
  .sort();

export const installDeps = async () => {
  await runCommand(
    "yarn install root",
    ["yarn", "--silent", "install", "--frozen-lockfile"],
    ".",
    true
  );

  for (const dir of directories) {
    await runCommand(
      `yarn install ${dir}`,
      ["yarn", "--silent", "install", "--frozen-lockfile"],
      dir,
      true
    );
  }
};

export const install = {
  command: "install",
  describe: "install all project dependencies",
  handler: async () => {},
};
