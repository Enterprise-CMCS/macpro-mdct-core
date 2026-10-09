#!/usr/bin/env -S tsx
import { LambdaClient, paginateListFunctions } from "@aws-sdk/client-lambda";
import { getResourceIdsOfType } from "../cloudFormation";
import { categorizeManagement } from "../utils";

const client = new LambdaClient({ region: "us-east-1" });

export async function audit() {
  const label = "Lambda Functions";
  const { unmanaged, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllLambdaFunctions()),
    managedResourceIds: await getResourceIdsOfType("AWS::Lambda::Function"),
  });
  const deleteCommands = unmanaged.map((name) => `aws lambda delete-function --function-name ${name}`);
  return { label, unmanaged, ignoreCounts, deleteCommands };
}

export async function* getAllLambdaFunctions() {
  for await (const page of paginateListFunctions({ client }, {})) {
    yield* page.Functions!.map(func => func.FunctionName!)
  }
}

async function main() {
  for await (const name of getAllLambdaFunctions()) {
    console.log(name);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
