#!/usr/bin/env -S tsx
import { S3Client, paginateListBuckets } from "@aws-sdk/client-s3";
import { getResourceIdsOfType } from "../cloudFormation";
import { categorizeManagement, getAccountId } from "../utils";

const client = new S3Client({ region: "us-east-1" });

export async function audit () {
  const label = "S3 Buckets";
  const accountId = await getAccountId();
  const { unmanaged, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllS3Buckets()),
    managedResourceIds: await getResourceIdsOfType("AWS::S3::Bucket"),
    ignoreSubstrings: [
      "prod",
      "us-west-2",
      "main",
      "master",
      ...(accountId ? [accountId] : []),
    ],
  });
  
  // commented out, since deleting a nonempty bucket is ESPECIALLY destructive.
  // const deleteCommands = unmanaged.map(bucketId =>
  //   `aws s3 rb s3://${bucketId} --force  # WARNING: Deletes all objects!`,
  // );

  return { label, unmanaged, ignoreCounts, deleteCommands: [] };
}

export async function* getAllS3Buckets() {
  for await (const page of paginateListBuckets({ client }, {})) {
    yield* page.Buckets!.map(bucket => bucket.Name!)
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
