#!/usr/bin/env -S tsx
import {
  CloudFrontClient,
  paginateListOriginAccessControls,
} from "@aws-sdk/client-cloudfront";
import { getResourceIdsOfType } from "../utils/stackInfo";
import { categorizeManagement } from "../utils/categorization";

const client = new CloudFrontClient({ region: "us-east-1" });

export async function audit() {
  const label = "CloudFront Origin Access Controls";
  const { unmanagedIds, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllOriginAccessControls()),
    managedResourceIds: await getResourceIdsOfType("AWS::CloudFront::OriginAccessControl"),
  })
  const deleteCommands = unmanagedIds.map(
    (id) => `aws cloudfront delete-origin-access-control --id ${id}`
  );
  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

async function* getAllOriginAccessControls() {
  for await (const page of paginateListOriginAccessControls({ client }, {})) {
    yield* page.OriginAccessControlList!.Items!.map(item => item.Id!)
  }
}

async function main() {
  for await (const id of getAllOriginAccessControls()) {
    console.log(id);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
