#!/usr/bin/env -S tsx
import {
  EC2Client,
  paginateDescribeNetworkInterfaces,
} from "@aws-sdk/client-ec2";
import { getResourceIdsOfType, getUnprefixedStackNames } from "../utils/stackInfo";
import { categorizeManagement } from "../utils/categorization";

const client = new EC2Client({ region: "us-east-1" });

export async function audit() {
  const label = "Network Interfaces (ENIs)";
  const managedEnis = await getResourceIdsOfType("AWS::EC2::NetworkInterface");
  
  // Exclude ENIs that contain a CloudFormation stack name (treated as managed)
  const allNetworkInterfaces = await Array.fromAsync(getAllNetworkInterfaces());
  const stackNames = await getUnprefixedStackNames();
  const stackSpecificEnis = allNetworkInterfaces
    .filter((eni) => stackNames.some(name => eni.includes(name)));

  const { unmanagedIds, ignoreCounts } = categorizeManagement({
    allResourceIds: allNetworkInterfaces,
    managedResourceIds: [...managedEnis, ...stackSpecificEnis],
    ignoredSubstrings: [
      "main",
      "master",
      "Transit Gateway",
      "VPC Endpoint Interface",
    ]
  });
  const deleteCommands = unmanagedIds.map((detail) => {
    const id = detail.split(" - ")[0];
    return `aws ec2 delete-network-interface --network-interface-id ${id}`;
  });
  
  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

export async function* getAllNetworkInterfaces() {
  for await (const page of paginateDescribeNetworkInterfaces({ client }, {})) {
  yield* (page.NetworkInterfaces ?? [])
    .map((eni) => {
      const id = eni.NetworkInterfaceId!;
      const description = eni.Description || "(no description)";
      const status = eni.Status || "unknown";
      return `${id} - ${description} - ${status}`;
    })
  }
}

async function main() {
  for await (const eni of getAllNetworkInterfaces()) {
    console.log(eni);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
