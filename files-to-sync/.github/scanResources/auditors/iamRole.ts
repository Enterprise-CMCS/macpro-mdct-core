#!/usr/bin/env -S tsx
import { IAMClient, paginateListRoles } from "@aws-sdk/client-iam";
import { getResourceIdsOfType } from "../utils/stackInfo";
import { categorizeManagement } from "../utils/categorization";

const client = new IAMClient({ region: "us-east-1" });

export async function audit () {
  const label = "IAM Roles (project-scoped, excluding service-linked)";
  const { unmanagedIds, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllIamRoles()),
    managedResourceIds: await getResourceIdsOfType("AWS::IAM::Role"),
    ignoredPrefixes: ["seds", "qmr", "mcr", "mfp", "hcbs", "carts"],
  });
  const deleteCommands = unmanagedIds.flatMap((name) => [
    `# Delete IAM role ${name}`,
    `aws iam list-attached-role-policies --role-name ${name} --query 'AttachedPolicies[].PolicyArn' --output text | xargs -n1 aws iam detach-role-policy --role-name ${name} --policy-arn`,
    `aws iam list-role-policies --role-name ${name} --query 'PolicyNames[]' --output text | xargs -n1 aws iam delete-role-policy --role-name ${name} --policy-name`,
    `aws iam delete-role --role-name ${name}`,
  ]);
  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

export async function* getAllIamRoles() {
  for await (const page of paginateListRoles({ client }, { MaxItems: 1000 })) {
    yield* page.Roles!.map(role => role.RoleName!)
  }
}

async function main() {
  for await (const role of getAllIamRoles()) {
    console.log(role);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
