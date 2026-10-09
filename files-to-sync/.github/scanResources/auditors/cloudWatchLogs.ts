#!/usr/bin/env -S tsx
import { CloudWatchLogsClient, paginateDescribeLogGroups } from "@aws-sdk/client-cloudwatch-logs";
import { APIGatewayClient, GetStagesCommand } from "@aws-sdk/client-api-gateway";
import { getResourceIds } from "../utils/stackInfo";
import { categorizeManagement } from "../utils/categorization";
import { ResourceTypes } from "../utils/types";

const client = new CloudWatchLogsClient({ region: "us-east-1" });

export async function audit() {
  const label = "CloudWatch Log Groups";
  const { unmanagedIds, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllLogGroups()),
    managedResourceIds: [
      ...await getResourceIds(ResourceTypes.LogGroup),
      ...(await getResourceIds(ResourceTypes.LambdaFunction))
        .map((id) => `/aws/lambda/${id}`),
      ...(await Array.fromAsync(getAllStages()))
        .map(({ restApiId, stageName }) => `API-Gateway-Execution-Logs_${restApiId}/${stageName}`),
    ],
    ignoredPrefixes: [
      "/aws/ec2",
      "/aws/rds",
      "/aws/lambda/CMS-Cloud",
      "/aws/lambda/cms-cloud",
      "/aws/lambda/NewRelicInfrastructure-Integrations-LambdaFunction",
    ],
    ignoredIds: [
      "/aws/ssm/CMS-Cloud-Security-RunInspec",
      "amazon-ssm-agent.log",
      "cms-cloud-vpc-querylogs",
      "/aws/apigateway/welcome",
      "/aws/lambda/CF-Custom-Resource-SSM-Association",
      "/aws/lambda/CMS-Custom-Resource-Placeholder-Document",
      "/aws/lambda/ITOPS-Security-Attach-Inspector-to-SNS",
      "/aws-dynamodb/imports",
    ],
    ignoredSubstrings: ["main"],
  });
  const deleteCommands = unmanagedIds.map(
    (id) => `aws logs delete-log-group --log-group-name ${id}`
  );
  
  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

async function* getAllStages() {
  const apiClient = new APIGatewayClient({ region: "us-east-1" });
  const apiIds = await getResourceIds(ResourceTypes.RestApi);
  for (let restApiId of apiIds) {
    const stages = await apiClient.send(new GetStagesCommand({ restApiId }));
    const stageNames = stages.item!.map(s => s.stageName!).filter(Boolean);
    yield* stageNames.map(stageName => ({ restApiId, stageName }));
  }
}

async function* getAllLogGroups() {
  for await (const page of paginateDescribeLogGroups({ client }, {})) {
    yield* page.logGroups!.map(group => group.logGroupName!);
  }
}

async function main() {
  for await (const name of getAllLogGroups()) {
    console.log(name);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
