#!/usr/bin/env -S tsx
import {
  CloudFrontClient,
  paginateListDistributions,
} from "@aws-sdk/client-cloudfront";
import { getResourceIdsOfType } from "../utils/stackInfo";
import { categorizeManagement } from "../utils/categorization";

const client = new CloudFrontClient({ region: "us-east-1" });

export async function audit() {
  const label = "CloudFront Distributions";
  const { unmanagedIds, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllDistributions()),
    managedResourceIds: await getResourceIdsOfType("AWS::CloudFront::Distribution"),
  });
  const deleteCommands = unmanagedIds.flatMap((id) => [
    `# Disable and delete distribution ${id}`,
    `aws cloudfront get-distribution-config --id ${id} > /tmp/dist-config-${id}.json`,
    `# Manually edit /tmp/dist-config-${id}.json to set Enabled to false, then:`,
    `aws cloudfront update-distribution --id ${id} --distribution-config file:///tmp/dist-config-${id}.json --if-match <ETag>`,
    `aws cloudfront delete-distribution --id ${id} --if-match <ETag>`,
  ]);
  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

async function* getAllDistributions() {
  for await (const page of paginateListDistributions({ client }, {})) {
    yield* page.DistributionList!.Items!.map(dist => dist.Id!);
  }
}

async function main() {
  for await (const id of getAllDistributions()) {
    console.log(id);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
