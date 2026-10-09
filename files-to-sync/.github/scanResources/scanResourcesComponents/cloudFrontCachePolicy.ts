#!/usr/bin/env -S tsx
import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
import { getResourceIdsOfType } from "../cloudFormation";
import { cloudFront_paginateListCachePolicies } from "../missingPaginators";
import { categorizeManagement } from "../utils";

const client = new CloudFrontClient({ region: "us-east-1" });

export async function audit() {
  const label = "CloudFront Custom Cache Policies";
  const { unmanaged, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllCustomCachePolicies()),
    managedResourceIds: await getResourceIdsOfType("AWS::CloudFront::CachePolicy"),
  });
  const deleteCommands = unmanaged.map(
    (id) => `aws cloudfront delete-cache-policy --id ${id}`
  );
  return { label, unmanaged, ignoreCounts, deleteCommands };
}

async function* getAllCustomCachePolicies() {
  for await (const page of cloudFront_paginateListCachePolicies({ client }, {})) {
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
