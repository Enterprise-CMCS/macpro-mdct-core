#!/usr/bin/env -S tsx
import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
import { getResourceIds } from "../utils/stackInfo";
import { paginateListCachePolicies } from "../utils/customPaginators/cloudfront";
import { classifyResources } from "../utils/categorization";
import { ResourceTypes } from "../utils/types";

const client = new CloudFrontClient({ region: "us-east-1" });

export async function audit() {
  const label = "CloudFront Custom Cache Policies";
  const { unmanagedIds, ignoreCounts } = classifyResources({
    allResourceIds: await Array.fromAsync(getAllCustomCachePolicies()),
    managedIds: await getResourceIds(ResourceTypes.CachePolicy),
  });
  const deleteCommands = unmanagedIds.map(
    (id) => `aws cloudfront delete-cache-policy --id ${id}`
  );
  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

async function* getAllCustomCachePolicies() {
  for await (const page of paginateListCachePolicies({ client }, {})) {
    yield* page.CachePolicyList!.Items!
      .filter(policy => policy.Type === "custom")
      .map(policy => policy.CachePolicy!.Id!);
  }
}

async function main() {
  for await (const id of getAllCustomCachePolicies()) {
    console.log(id);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
