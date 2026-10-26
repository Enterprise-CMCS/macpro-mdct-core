#!/usr/bin/env -S tsx
import { S3Client, paginateListBuckets } from "@aws-sdk/client-s3";
import { getResourceIds } from "../utils/stackInfo";
import { classifyResources } from "../utils/categorization";
import { getAccountId } from "../utils/identity";
import { ResourceTypes } from "../utils/types";

const client = new S3Client({ region: "us-east-1" });

export async function audit() {
  const label = "S3 Buckets";
  const accountId = await getAccountId();
  const { unmanagedIds, ignoreCounts } = classifyResources({
    allResourceIds: await Array.fromAsync(getAllS3Buckets()),
    managedIds: await getResourceIds(ResourceTypes.S3Bucket),
    ignoredSubstrings: [
      "prod",
      "us-west-2",
      "main",
      "master",
      ...(accountId ? [accountId] : []),
    ],
  });

  // Commented out, since deleting a nonempty bucket is ESPECIALLY destructive.
  // const deleteCommands = unmanagedIds.map(bucketId =>
  //   `aws s3 rb s3://${bucketId} --force  # WARNING: Deletes all objects!`,
  // );
  const deleteCommands: string[] = [];

  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

export async function* getAllS3Buckets() {
  for await (const page of paginateListBuckets({ client }, {})) {
    yield* page.Buckets!.map((bucket) => bucket.Name!);
  }
}

async function main() {
  for await (const bucket of getAllS3Buckets()) {
    console.log(bucket);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
