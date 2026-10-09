#!/usr/bin/env -S tsx
import {
  KMSClient,
  paginateListKeys,
  DescribeKeyCommand,
} from "@aws-sdk/client-kms";
import { getResourceIds } from "../utils/stackInfo";
import { classifyResources } from "../utils/categorization";
import { ResourceTypes } from "../utils/types";

const client = new KMSClient({ region: "us-east-1" });

export async function audit () {
  const label = "KMS Keys";
  const allKmsKeys = await Array.fromAsync(getAllKmsKeys());

  // Treat KMS keys as managed if they're directly managed by CloudFormation
  // OR if they're referenced by a CloudFormation-managed KMS alias
  const directlyManagedKeys = await getResourceIds(ResourceTypes.KmsKey);
  const cfManagedAliases = await getResourceIds(ResourceTypes.KmsAlias);
  const keysFromAliases = (await Promise.all(cfManagedAliases.map(getKeyIdFromAlias)))
    .filter(Boolean);

  // Combine both types - these are just key IDs
  const managedKeyIds = new Set([...directlyManagedKeys, ...keysFromAliases]);

  const { unmanagedIds, ignoreCounts } = classifyResources({
    allResourceIds: allKmsKeys,
    managedIds: allKmsKeys.filter((keyDetail) => {
      // For matching, we need to check if the key ID (before " - ") is in the managed set
      const keyId = keyDetail.split(" - ")[0];
      return managedKeyIds.has(keyId);
    }),
    ignoredSubstrings: [
      "Tenable",
      "AWS Backups",
      "CloudTrail",
      "KMS key for encrypting logs",
    ],
  });

  const deleteCommands = unmanagedIds.map((detail) => {
    const id = detail.split(" - ")[0];
    return `aws kms schedule-key-deletion --key-id ${id} --pending-window-in-days 7`;
  });
  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

/**
 * Return the key description,
 * OR a fallback value if fetching the description fails,
 * OR undefined if the key is managed by AWS (and thus cannot be deleted)
 */
async function describeKey (KeyId: string) {
  try {
    const result = await client.send(new DescribeKeyCommand({ KeyId }));
    if (result.KeyMetadata?.KeyManager === "AWS") {
      return undefined;
    }
    return result.KeyMetadata?.Description || "(no description)";
  } catch {
    return "(unable to describe)";
  }
}

async function getKeyIdFromAlias (alias: string) {
  try {
    const result = await client.send(new DescribeKeyCommand({ KeyId: alias }));
    return result.KeyMetadata?.KeyId;
  } catch {
    // Alias might not exist, or might have been deleted
    return undefined;
  }
}

export async function* getAllKmsKeys() {
  for await (const page of paginateListKeys({ client }, { Limit: 100 })) {
    for (const id of (page.Keys ?? []).map(key => key.KeyId!)) {
      const description = await describeKey(id);
      if (!description) {
        continue;
      }
      yield `${id} - ${description}`;
    }
  }
}

async function main() {
  for await (const key of getAllKmsKeys()) {
    console.log(key);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
