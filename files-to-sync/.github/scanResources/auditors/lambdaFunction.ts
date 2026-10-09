#!/usr/bin/env -S tsx
import { LambdaClient, paginateListFunctions } from "@aws-sdk/client-lambda";
import { getResourceIds } from "../utils/stackInfo";
import { classifyResources } from "../utils/categorization";
import { ResourceTypes } from "../utils/types";

const client = new LambdaClient({ region: "us-east-1" });

export async function audit() {
  const label = "Lambda Functions";
  const { unmanagedIds, ignoreCounts } = classifyResources({
    allResourceIds: await Array.fromAsync(getAllLambdaFunctions()),
    managedIds: await getResourceIds(ResourceTypes.LambdaFunction),
  });
  const deleteCommands = unmanagedIds.map((name) => `aws lambda delete-function --function-name ${name}`);
  return { label, unmanagedIds, ignoreCounts, deleteCommands };
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
