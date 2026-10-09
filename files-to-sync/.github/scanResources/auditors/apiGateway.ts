#!/usr/bin/env -S tsx
import { APIGatewayClient, paginateGetRestApis } from "@aws-sdk/client-api-gateway";
import { getResourceIds } from "../utils/stackInfo";
import { categorizeManagement } from "../utils/categorization";
import { ResourceTypes } from "../utils/types";

const client = new APIGatewayClient({ region: "us-east-1" });

export async function audit() {
  const label = "API Gateway REST APIs";
  const { unmanagedIds, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllRestApis()),
    managedResourceIds: await getResourceIds(ResourceTypes.RestApi),
  });
  const deleteCommands = unmanagedIds.map(
    (id) => `aws apigateway delete-rest-api --rest-api-id ${id}`
  );
  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

async function* getAllRestApis() {
  for await (const page of paginateGetRestApis({ client }, { limit: 500 })) {
    yield* page.items!.map(api => api.id!);
  }
}

async function main() {
  for await (const id of getAllRestApis()) {
    console.log(id);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
