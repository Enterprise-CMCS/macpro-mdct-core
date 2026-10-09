#!/usr/bin/env -S tsx
import {
  CloudWatchLogsClient,
  paginateDescribeLogGroups,
} from "@aws-sdk/client-cloudwatch-logs";
import { getResourceIdsOfType } from "../cloudFormation";
import { getAllStages } from "./apiGateway";
import { categorizeManagement } from "../utils";

const client = new CloudWatchLogsClient({ region: "us-east-1" });

export async function audit() {
  const label = "CloudWatch Log Groups";
  const { unmanaged, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllLogGroups()),
    managedResourceIds: [
      ...await getResourceIdsOfType("AWS::Logs::LogGroup"),
      ...(await getResourceIdsOfType("AWS::Lambda::Function"))
        .map((id) => `/aws/lambda/${id}`),
      ...(await Array.fromAsync(getAllStages()))
        .map(({ restApiId, stageName }) => `API-Gateway-Execution-Logs_${restApiId}/${stageName}`),
    ],
    ignorePrefixes: [
      "/aws/ec2",
      "/aws/rds",
      "/aws/lambda/CMS-Cloud",
      "/aws/lambda/cms-cloud",
      "/aws/lambda/NewRelicInfrastructure-Integrations-LambdaFunction",
    ],
    ignoreExact: [
      "/aws/ssm/CMS-Cloud-Security-RunInspec",
      "amazon-ssm-agent.log",
      "cms-cloud-vpc-querylogs",
      "/aws/apigateway/welcome",
      "/aws/lambda/CF-Custom-Resource-SSM-Association",
      "/aws/lambda/CMS-Custom-Resource-Placeholder-Document",
      "/aws/lambda/ITOPS-Security-Attach-Inspector-to-SNS",
      "/aws-dynamodb/imports",
    ],
    ignoreSubstrings: ["main"],
  });
  const deleteCommands = unmanaged.map(
    (id) => `aws logs delete-log-group --log-group-name ${id}`
  );
  
  return { label, unmanaged, ignoreCounts, deleteCommands };
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
