#!/usr/bin/env -S tsx
import { EC2Client, paginateDescribeSecurityGroups } from "@aws-sdk/client-ec2";
import { getUnprefixedStackNames, getResourceIds } from "../utils/stackInfo";
import { classifyResources } from "../utils/categorization";
import { ResourceTypes } from "../utils/types";

const client = new EC2Client({ region: "us-east-1" });

export async function audit () {
  const label = "Security Groups";
  
  // Treat security groups that contain CloudFormation stack names as managed
  const allSecurityGroups = await Array.fromAsync(getAllSecurityGroups());
  const stackNames = await getUnprefixedStackNames();
  const stackSpecificSecurityGroups = allSecurityGroups
    .filter((sg) => stackNames.some(name => sg.includes(name)))

  const { unmanagedIds, ignoreCounts } = classifyResources({
    allResourceIds: allSecurityGroups,
    managedIds: [
      ...stackSpecificSecurityGroups,
      ...await getResourceIds(ResourceTypes.SecurityGroup),
    ],
    ignoredSubstrings: [
      "cmscloud",
      "main",
      "master",
      "default VPC security group",
    ],
  });

  const deleteCommands = unmanagedIds.map((detail) => {
    const id = detail.split(" - ")[0];
    return `aws ec2 delete-security-group --group-id ${id}`;
  })

  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

async function* getAllSecurityGroups() {
  for await (const page of paginateDescribeSecurityGroups({ client }, {})) {
    yield* (page.SecurityGroups ?? [])
      .map(sg => {
        const groupId = sg.GroupId!;
        const groupName = sg.GroupName || "(no name)";
        const description = sg.Description || "(no description)";
        return `${groupId} - ${groupName} - ${description}`;
      });
  }
}

async function main() {
  for await (const securityGroup of getAllSecurityGroups()) {
    console.log(securityGroup);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
