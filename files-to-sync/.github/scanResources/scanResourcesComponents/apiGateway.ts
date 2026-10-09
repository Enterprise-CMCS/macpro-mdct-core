#!/usr/bin/env -S tsx
import {
  APIGatewayClient,
  GetStagesCommand,
  paginateGetRestApis,
} from "@aws-sdk/client-api-gateway";
import { getResourceIdsOfType } from "../cloudFormation";
import { categorizeManagement } from "../utils";

const client = new APIGatewayClient({ region: "us-east-1" });

export async function audit() {
  const label = "API Gateway REST APIs";
  const { unmanaged, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllRestApis()),
    managedResourceIds: await getResourceIdsOfType("AWS::ApiGateway::RestApi"),
  });
  const deleteCommands = unmanaged.map(
    (id) => `aws apigateway delete-rest-api --rest-api-id ${id}`
  );
  return { label, unmanaged, ignoreCounts, deleteCommands };
}

export async function* getAllStages() {
  const apiIds = await getResourceIdsOfType("AWS::ApiGateway::RestApi");
  for (let restApiId of apiIds) {
    const stages = await client.send(new GetStagesCommand({ restApiId }));
    const stageNames = stages.item!.map(s => s.stageName!).filter(Boolean);
    yield* stageNames.map(stageName => ({ restApiId, stageName }));
  }
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
