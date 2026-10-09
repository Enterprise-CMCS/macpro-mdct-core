#!/usr/bin/env -S tsx
import {
  CloudFormationClient,
  paginateListStackResources,
  paginateListStacks,
  StackResourceSummary,
  StackStatus,
  StackSummary,
} from "@aws-sdk/client-cloudformation";

const client = new CloudFormationClient({
  region: "us-east-1",
  maxAttempts: 10,
});

let cachedStacks: StackSummary[] | undefined;
export async function getAllStacks() {
  if (cachedStacks) return cachedStacks;

  const NOT_DELETED = Object.values(StackStatus).filter((s) => s !== StackStatus.DELETE_COMPLETE);
  const stacks = (await Array.fromAsync(
    paginateListStacks({ client }, { StackStatusFilter: NOT_DELETED }),
    (page) => page.StackSummaries!
  )).flat()

  cachedStacks = stacks;
  return stacks;
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
  const stackSummaries = await getAllStacks();
  const projectPrefixRegex = /^(seds|qmr|mcr|mfp|hcbs|carts)-/i; // |app-api
  return stackSummaries.map((stack) => {
    if (!stack.StackName) {
      return undefined;
    }
    if (!projectPrefixRegex.test(stack.StackName)) {
      return stack.StackName;
    }
    const unprefixedName = stack.StackName.replace(projectPrefixRegex, "");
    if (unprefixedName.length <= 5) {
      return undefined;
    }
    return unprefixedName;
  })
  .filter(Boolean)
  .filter((name, i, arr) => i === arr.indexOf(name)) as string[];
}

const relevantTypes = [
  "AWS::ApiGateway::RestApi",
  "AWS::CloudFront::CachePolicy",
  "AWS::CloudFront::Distribution",
  "AWS::CloudFront::OriginAccessControl",
  "AWS::CloudFront::ResponseHeadersPolicy",
  "AWS::Cognito::IdentityPool",
  "AWS::Cognito::UserPool",
  "AWS::DynamoDB::Table",
  "AWS::EC2::NetworkInterface",
  "AWS::EC2::SecurityGroup",
  "AWS::Events::Rule",
  "AWS::IAM::ManagedPolicy",
  "AWS::IAM::Policy",
  "AWS::IAM::Role",
  "AWS::KMS::Alias",
  "AWS::KMS::Key",
  "AWS::Lambda::Function",
  "AWS::Lambda::LayerVersion",
  "AWS::Logs::LogGroup",
  "AWS::S3::Bucket",
  "AWS::WAFv2::WebACL",
] as const;
type RelevantResourceType = typeof relevantTypes[number];
function isRelevantType(x: unknown): x is RelevantResourceType {
  return relevantTypes.includes(x as any);
}

let cachedResourcesByType: Record<string, string[]> | undefined;
/** Map relevant resource types to a list of all resource IDs of that type */
async function getRelevantResourceIdsByType() {
  if (cachedResourcesByType) return cachedResourcesByType;
  
  const allResources: StackResourceSummary[] = [];
  for (const { StackName } of await getAllStacks()) {
    const resources = (await Array.fromAsync(
      paginateListStackResources({ client }, { StackName }),
      (page) => page.StackResourceSummaries!
        .filter((r) => r.PhysicalResourceId && isRelevantType(r.ResourceType!))
    )).flat();
    
    allResources.push(...resources);
  }

  const groups = Object.groupBy(allResources, r => r.ResourceType!);
  const resourceIdsByType = Object.fromEntries(
    Object.entries(groups).map(
      ([type, resources]) => [type, resources!.map(r => r.PhysicalResourceId!)]
    )
  );

  cachedResourcesByType = resourceIdsByType;
  return resourceIdsByType;
}

/** Get relevant resource IDs for a specific type */
export async function getResourceIdsOfType (type: string) {
  // TODO is there a way to typecheck this parameter without blowing up the function signature?
  if (!isRelevantType(type)) {
    throw new Error(`Invalid resource type: '${type}'`);
  }
  return (await getRelevantResourceIdsByType())[type] ?? [];
}

export async function getDeleteFailedStacks() {
  const paginator = paginateListStacks({ client }, { StackStatusFilter: [StackStatus.DELETE_FAILED] });
  const pages = await Array.fromAsync(paginator);
  return pages.flatMap(page => page.StackSummaries?.map(s => s.StackName!) ?? []);
}

export function deleteStackCommand(stackName: string) {
  return `aws cloudformation delete-stack --stack-name "${stackName}" --region us-east-1`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(await getRelevantResourceIdsByType());
}
