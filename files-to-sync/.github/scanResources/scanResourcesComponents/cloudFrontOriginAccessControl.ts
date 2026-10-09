#!/usr/bin/env -S tsx
import {
  CloudFrontClient,
  paginateListOriginAccessControls,
} from "@aws-sdk/client-cloudfront";
import { getResourceIdsOfType } from "../cloudFormation";
import { categorizeManagement } from "../utils";

const client = new CloudFrontClient({ region: "us-east-1" });

export async function audit() {
  const label = "CloudFront Origin Access Controls";
  const { unmanaged, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllOriginAccessControls()),
    managedResourceIds: await getResourceIdsOfType("AWS::CloudFront::OriginAccessControl"),
  })
  const deleteCommands = unmanaged.map(
    (id) => `aws cloudfront delete-origin-access-control --id ${id}`
  );
  return { label, unmanaged, ignoreCounts, deleteCommands };
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
