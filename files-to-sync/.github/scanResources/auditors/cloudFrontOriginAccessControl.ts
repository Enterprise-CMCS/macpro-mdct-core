#!/usr/bin/env -S tsx
import {
  CloudFrontClient,
  paginateListOriginAccessControls,
} from "@aws-sdk/client-cloudfront";
import { getResourceIds } from "../utils/stackInfo";
import { classifyResources } from "../utils/categorization";
import { ResourceTypes } from "../utils/types";

const client = new CloudFrontClient({ region: "us-east-1" });

export async function audit() {
  const label = "CloudFront Origin Access Controls";
  const { unmanagedIds, ignoreCounts } = classifyResources({
    allResourceIds: await Array.fromAsync(getAllOriginAccessControls()),
    managedIds: await getResourceIds(ResourceTypes.OriginAccessControl),
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
