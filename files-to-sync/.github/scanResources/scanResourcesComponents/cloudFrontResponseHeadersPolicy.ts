#!/usr/bin/env -S tsx
import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
import { getResourceIdsOfType } from "../cloudFormation";
import { cloudFront_paginateListResponseHeadersPolicies } from "../missingPaginators";
import { categorizeManagement } from "../utils";

const client = new CloudFrontClient({ region: "us-east-1" });

export async function audit() {
  const label = "CloudFront Custom Response Headers Policies";
  const { unmanaged, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllCustomResponseHeadersPolicies()),
    managedResourceIds: await getResourceIdsOfType("AWS::CloudFront::ResponseHeadersPolicy"),
  })
  const deleteCommands = unmanaged.map(
    (id) => `aws cloudfront delete-response-headers-policy --id ${id}`
  );
  return { label, unmanaged, ignoreCounts, deleteCommands };
}

async function* getAllCustomResponseHeadersPolicies() {
  for await (const page of cloudFront_paginateListResponseHeadersPolicies({ client }, {})) {
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
