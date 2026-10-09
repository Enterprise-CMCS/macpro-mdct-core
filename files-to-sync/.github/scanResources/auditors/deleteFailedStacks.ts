#!/usr/bin/env -S tsx
import {
  CloudFormationClient,
  paginateListStacks,
  StackStatus,
} from "@aws-sdk/client-cloudformation";
import { deleteStackCommand } from "../utils/stackInfo";

// This audit is unusual in that it deals with entire stacks,
// rather than individual resource IDs.
// But otherwise, it fits the AuditFunction pattern just fine.
// The same goes for the orphanedStacks audit.

const client = new CloudFormationClient({
  region: "us-east-1",
  maxAttempts: 10,
});

export async function audit () {
  const label = "CloudFormation Stacks in DELETE_FAILED State";
  const unmanagedIds = await Array.fromAsync(getDeleteFailedStacks());
  const deleteCommands = unmanagedIds.map(deleteStackCommand);
  return {
    label,
    unmanagedIds,
    ignoreCounts: {},
    deleteCommands,
  }
}

/** Get all stacks in a `DELETE_FAILED` state */
export async function* getDeleteFailedStacks() {
  const input = { StackStatusFilter: [StackStatus.DELETE_FAILED] };
  for await (const page of paginateListStacks({ client }, input)) {
    yield* (page.StackSummaries ?? []).map(s => s.StackName!)
  }
}
