#!/usr/bin/env -S tsx
import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
import { getResourceIds } from "../utils/stackInfo";
import { paginateListResponseHeadersPolicies } from "../utils/customPaginators/cloudfront";
import { categorizeManagement } from "../utils/categorization";
import { ResourceTypes } from "../utils/types";

const client = new CloudFrontClient({ region: "us-east-1" });

export async function audit() {
  const label = "CloudFront Custom Response Headers Policies";
  const { unmanagedIds, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllCustomResponseHeadersPolicies()),
    managedResourceIds: await getResourceIds(ResourceTypes.ResponseHeadersPolicy),
  })
  const deleteCommands = unmanagedIds.map(
    (id) => `aws cloudfront delete-response-headers-policy --id ${id}`
  );
  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

async function* getAllCustomResponseHeadersPolicies() {
  for await (const page of paginateListResponseHeadersPolicies({ client }, {})) {
    yield* page.ResponseHeadersPolicyList!.Items!
      .filter(item => item.Type === "custom")
      .map(item => item.ResponseHeadersPolicy!.Id!);
  }
}

async function main() {
  for await (const id of getAllCustomResponseHeadersPolicies()) {
    console.log(id);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
