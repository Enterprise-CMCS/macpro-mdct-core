#!/usr/bin/env -S tsx
import * as cloudFormation from "../utils/stackInfo";
import { Octokit } from "@octokit/rest";
import { categorizeManagement } from "../utils/categorization";
import { StackStatus } from "@aws-sdk/client-cloudformation";

export async function audit () {
  // Check for orphaned stacks (auto-detects in GitHub Actions or uses CLI arg)
  let repoName = process.argv[2];
  if (!repoName && process.env.GITHUB_REPOSITORY) {
    // Extract repo name from GITHUB_REPOSITORY (format: "owner/repo")
    repoName = process.env.GITHUB_REPOSITORY.split("/")[1];
  }
  if (!repoName) {
    return { warning: "Could not check Orphaned Stacks: Cannot determine repo name."};
  }

  try {
    const label = `CloudFormation Orphaned Stacks (No Matching Git Branch in ${repoName})`;
    const { unmanagedIds, ignoreCounts } = categorizeManagement({
      allResourceIds: (await getOrphanedStacks(repoName)).map(s => s.name),
      managedResourceIds: [],
      ignoredPrefixes: [
        "CMS-Cloud",
        "cloudtamer",
        "ct-",
        "Trend-Micro",
        "CPM",
        "cms",
        "security-hub-collector",
      ],
      ignoredIds: [
        "ConsolidatedPermissionBoundaryCFT",
        "CDKToolkit",
        "cbj-delete-snapshot",
        "smtp-ado-postfix-relay",
        "Wiz-Integration-Role",
        ...["seds", "qmr", "mcr", "mfp", "hcbs", "carts"]
          .map(project => `${project}-prerequisites`)
      ]
    });
    const deleteCommands = unmanagedIds.map(cloudFormation.deleteStackCommand);
    return { label, unmanagedIds, ignoreCounts, deleteCommands };
  } catch (error: any) {
    return { warning: `⚠️ Failed to check orphaned stacks: ${error?.message || error}\n` };
  }
}

export async function getRepoBranches(repoName: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not set");
  const octokit = new Octokit({ auth: token });
  const branches = await octokit.paginate(
    octokit.repos.listBranches,
    { owner: "Enterprise-CMCS", repo: repoName }
  );
  return branches.map(branch => branch.name);
}

export async function getOrphanedStacks(repoName: string) {
  const stackSummaries = await cloudFormation.getAllStacks();
  const stacks = stackSummaries
    .filter(
      (s) =>
        s.StackName &&
        s.CreationTime &&
        s.StackStatus !== StackStatus.DELETE_COMPLETE
    )
    .map((s) => ({
      name: s.StackName!,
      creationTime: s.CreationTime!,
      status: s.StackStatus!,
    }));

  const branches = await getRepoBranches(repoName);

  const orphanedStacks = stacks
    .filter((stack) => !branches.some((branch) => stack.name.includes(branch)))
    .toSorted((a, b) => a.creationTime.getTime() - b.creationTime.getTime());

  return orphanedStacks;
}
