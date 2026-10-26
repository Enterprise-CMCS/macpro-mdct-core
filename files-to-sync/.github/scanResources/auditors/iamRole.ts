#!/usr/bin/env -S tsx
import { IAMClient, paginateListRoles } from "@aws-sdk/client-iam";
import { getResourceIds, PROJECT_NAMES } from "../utils/stackInfo";
import { classifyResources } from "../utils/categorization";
import { ResourceTypes } from "../utils/types";

const client = new IAMClient({ region: "us-east-1" });

export async function audit() {
  const label = "IAM Roles (project-scoped, excluding service-linked)";
  const allRoles = (await Array.fromAsync(getAllIamRoles()))
    .filter((role) => PROJECT_NAMES.some(p => role.startsWith(p)));
  
  const { unmanagedIds, ignoreCounts } = classifyResources({
    allResourceIds: allRoles,
    managedIds: await getResourceIds(ResourceTypes.IamRole),
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
    yield* page.Roles!.map((role) => role.RoleName!);
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
