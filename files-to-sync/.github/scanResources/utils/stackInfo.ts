#!/usr/bin/env -S tsx
import {
  CloudFormationClient,
  paginateListStackResources,
  paginateListStacks,
  StackStatus,
  StackSummary,
} from "@aws-sdk/client-cloudformation";
import { ResourceType, isResourceType } from "./types";

const client = new CloudFormationClient({
  region: "us-east-1",
  maxAttempts: 10,
});
let cachedStacks: StackSummary[] | undefined;
let cachedResourcesByType: Record<string, string[]> | undefined;

/** Get all stacks not in a `DELETE_COMPLETE` state */
export async function getAllStacks() {
  if (cachedStacks) return cachedStacks;

  async function* _fetchStacks() {
    const input = {
      StackStatusFilter: Object.values(StackStatus)
        .filter((s) => s !== StackStatus.DELETE_COMPLETE)
    };
    for await (const page of paginateListStacks({ client }, input)) {
      yield* page.StackSummaries!;
    }
  }

  cachedStacks = await Array.fromAsync(_fetchStacks());
  return cachedStacks;
}

/**
 * Get all stack names,
 * removing project prefix (ex: `"mfp-foobar"` becomes `"foobar"`),
 * omitting prefixed names that would be too short (ex: `"mfp-foo"` is excluded)
 *
 * Why? Stack names often have project prefixes (ex: `"seds-x8e03cb1432"`)
 * but ENI descriptions just have the suffix (ex: `"x8e03cb1432"`).
 * The same goes for security groups.
 */
export async function getUnprefixedStackNames () {
  function removePrefix (name: string | undefined) {
    const projectPrefixRegex = /^(seds|qmr|mcr|mfp|hcbs|carts)-/i; // |app-api
    if (!name) {
      return undefined;
    }
    if (!projectPrefixRegex.test(name)) {
      return name;
    }
    const unprefixedName = name.replace(projectPrefixRegex, "");
    if (unprefixedName.length <= 5) {
      return undefined;
    }
    return unprefixedName;    
  }

  return (await getAllStacks())
    .map((stack) => removePrefix(stack.StackName))
    .filter(Boolean)
    .filter((name, i, arr) => i === arr.indexOf(name)) as string[];
}

/**
 * Get all resources, across all non-deleted stacks.
 *
 * Omit resources of non-audited types, and those with no physical ID.
 */
async function* getAllResources() {
  for (const { StackName } of await getAllStacks()) {
    for await (const page of paginateListStackResources({ client }, { StackName })) {
      yield* page.StackResourceSummaries!
        .filter((r) => r.PhysicalResourceId && isResourceType(r.ResourceType))
    }
  }
}

/** Map resource types to a list of IDs of resources of that type */
async function getResourceIdsByType() {
  if (cachedResourcesByType) return cachedResourcesByType;
  
  const allResources = await Array.fromAsync(getAllResources())
  const resourcesByType = Object.groupBy(allResources, r => r.ResourceType!);
  const resourceIdsByType = Object.fromEntries(
    Object.entries(resourcesByType).map(
      ([type, resources]) => [type, resources!.map(r => r.PhysicalResourceId!)]
    )
  );

  cachedResourcesByType = resourceIdsByType;
  return resourceIdsByType;
}

/**
 * Get relevant resource IDs for a specific type.
 *
 * We know these are managed by CloudFormation because that's where we got them.
 */
export async function getResourceIds(type: ResourceType) {
  if (!isResourceType(type)) {
    throw new Error(`Unexpected resource type: '${type}'`);
  }

  return (await getResourceIdsByType())[type] ?? [];
}

/** Generate the AWS CLI command to delete this stack */
export function deleteStackCommand(stackName: string) {
  return `aws cloudformation delete-stack --stack-name "${stackName}" --region us-east-1`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(await getResourceIdsByType());
}
