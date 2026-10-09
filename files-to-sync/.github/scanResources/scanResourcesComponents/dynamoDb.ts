#!/usr/bin/env -S tsx
import { DynamoDBClient, paginateListTables } from "@aws-sdk/client-dynamodb";
import { getResourceIdsOfType } from "../cloudFormation";
import { categorizeManagement } from "../utils";

const client = new DynamoDBClient({ region: "us-east-1" });

export async function audit() {
  const label = "DynamoDB Tables";
  const { unmanaged, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllTableNames()),
    managedResourceIds: await getResourceIdsOfType("AWS::DynamoDB::Table"),
    ignoreSubstrings: ["main"],
  });
  const deleteCommands = unmanaged.map(
    (name) => `aws dynamodb delete-table --table-name ${name}`
  );
  return { label, unmanaged, ignoreCounts, deleteCommands };
}

export async function* getAllTableNames() {
  for await (const page of paginateListTables({ client }, { Limit: 100 })) {
    yield* page.TableNames!
  }
}

async function main() {
  for await (const table of getAllTableNames()) {
    console.log(table);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
