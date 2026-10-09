#!/usr/bin/env -S tsx
import fs from "node:fs";
import path from "node:path";
import { getAccountIdentifier } from "./utils";
import { getOrphanedStacks } from "./scanResourcesComponents/orphanedStacks";

interface StackInfo {
  name: string;
  creationTime: Date;
  status: string;
}

async function main() {
  const repoName = process.argv[2];
  if (!repoName) {
    console.error(
      "Usage: auditCloudFormationStacksAgainstGitBranches.ts <repo-name>"
    );
    console.error(
      "Example: auditCloudFormationStacksAgainstGitBranches.ts macpro-mdct-hcbs"
    );
    process.exit(1);
  }

  const repoEnding = repoName
    .replace(/^macpro-mdct-/, "")
    .replaceAll(/[^a-zA-Z]/g, "");
  const accountIdentifier = await getAccountIdentifier();
  const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
  const filename = `orphaned-stacks-${repoEnding}-${accountIdentifier}-${timestamp}.txt`;
  // Prevent path traversal
  const basename = path.basename(filename);
  const outputFile = path.join(process.cwd(), basename);

  const log = (line: string = "") => {
    console.log(line);
    fs.appendFileSync(outputFile, line + "\n");
  };

  log(`CloudFormation Stack Audit Report`);
  log(`Repository: ${repoName}`);
  log(`Account: ${accountIdentifier}`);
  log(`Generated: ${new Date().toISOString()}`);
  log();

  console.log("Fetching CloudFormation stacks and branches...");
  let orphanedStacks: StackInfo[] = [];
  try {
    orphanedStacks = await getOrphanedStacks(repoName);
  } catch (error: any) {
    log(`Failed to fetch orphaned stacks: ${error?.message || error}`);
    process.exit(1);
  }

  log(`Orphaned stacks (no matching branch): ${orphanedStacks.length}`);
  log();

  if (orphanedStacks.length === 0) {
    log("✅ No orphaned stacks found.");
  } else {
    log("❌ Orphaned stacks:");
    for (const stack of orphanedStacks) {
      log(
        `- ${
          stack.name
        } (Created: ${stack.creationTime.toISOString()}, Status: ${
          stack.status
        })`
      );
    }
  }

  log();
  log(`Report saved to: ${outputFile}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
