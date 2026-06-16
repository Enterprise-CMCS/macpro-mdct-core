#!/usr/bin/env node
// This file is managed by macpro-mdct-core so if you'd like to change it let's do it there
import { Octokit } from "@octokit/rest";
import { createActionAuth } from "@octokit/auth-action";
import {
  CloudFormationClient,
  DeleteStackCommand,
  DescribeStackEventsCommand,
  ListStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { setBranchName } from "./setBranchName.ts";

const [owner, repo] = process.env.GITHUB_REPO!.split("/");
const appName = process.env.APP_NAME_LOWER!;
const deleteDelayMs = 1000;

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getDeleteFailedMessage(
  cfn: CloudFormationClient,
  stackName: string
): Promise<string> {
  const response = await cfn.send(
    new DescribeStackEventsCommand({ StackName: stackName })
  );
  const failedStackEvent = response.StackEvents?.find(
    (event) =>
      event.ResourceType === "AWS::CloudFormation::Stack" &&
      event.LogicalResourceId === stackName &&
      event.ResourceStatus === "DELETE_FAILED"
  );

  if (!failedStackEvent?.ResourceStatusReason) {
    throw new Error(`Could not find DELETE_FAILED reason for ${stackName}`);
  }

  return [
    `Stack: ${stackName}`,
    `Previous DELETE_FAILED reason: ${failedStackEvent.ResourceStatusReason}`,
  ].join("\n");
}

async function run() {
  const authentication = await createActionAuth()();
  const octokit = new Octokit({ auth: authentication.token });
  const cfn = new CloudFormationClient({});

  // gets all branches from github in stack name format
  const { data } = await octokit.repos.listBranches({
    owner,
    repo,
  });
  const legitStacks = data.map(
    (branch) => `${appName}-${setBranchName(branch.name)}`
  );
  // all aws stacks that start with [appName]-
  const allAppStacks: string[] = [];
  const response = await cfn.send(
    new ListStacksCommand({
      StackStatusFilter: [
        "CREATE_COMPLETE",
        "UPDATE_COMPLETE",
        "DELETE_FAILED",
      ],
    })
  );
  const deleteFailedStacks = response
    .StackSummaries!.filter(
      (stack) =>
        stack.StackStatus === "DELETE_FAILED" &&
        stack.StackName?.startsWith(`${appName}-`) &&
        stack.StackName !== `${appName}-prerequisites`
    )
    .map((stack) => stack.StackName!);
  const appStacks = response
    .StackSummaries!.map((stack) => stack.StackName)
    .filter(
      (stackName) =>
        stackName!.startsWith(`${appName}-`) &&
        stackName !== `${appName}-prerequisites`
    ) as string[];
  allAppStacks.push(...appStacks);

  // stacks that are in aws but without corresponding branches in github are deletable
  const deletableStacks = allAppStacks.filter(
    (item) => !legitStacks.includes(item)
  );
  console.log("\n=== Deletable Stacks ===");
  deletableStacks.forEach((stack) => console.log(`  ${stack}`));
  console.log("=======================\n");

  for (const stack of deletableStacks) {
    if (deleteFailedStacks.includes(stack)) {
      const deleteFailedMessage = await getDeleteFailedMessage(cfn, stack);
      console.log(deleteFailedMessage);
    }
    await wait(deleteDelayMs);
    await cfn.send(
      new DeleteStackCommand({
        StackName: stack,
      })
    );
    console.log(`Issued delete command for ${stack}`);
  }
}

run();
