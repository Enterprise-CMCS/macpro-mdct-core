#!/usr/bin/env -S tsx
import {
  LambdaClient,
  paginateListLayers,
  paginateListLayerVersions,
} from "@aws-sdk/client-lambda";
import { getResourceIdsOfType } from "../utils/stackInfo";
import { categorizeManagement } from "../utils/categorization";

const client = new LambdaClient({ region: "us-east-1" });

export async function audit() {
  const label = "Lambda LayerVersions";
  const { unmanagedIds, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllLayerVersionArns()),
    managedResourceIds: await getResourceIdsOfType("AWS::Lambda::LayerVersion"),
  });
  const deleteCommands = unmanagedIds.map((arn) => {
    const [layerName, layerVersion] = arn.split(":").slice(6);
    return `aws lambda delete-layer-version --layer-name ${layerName} --version-number ${layerVersion}`;
  });
  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

async function* getAllLayerVersionArns() {
  for await (const layerPage of paginateListLayers({ client }, {})) {
    for (const { LayerName } of layerPage.Layers!) {
      for await (const versionPage of paginateListLayerVersions({ client }, { LayerName })) {
        yield* versionPage.LayerVersions!.map(v => v.LayerVersionArn!);
      }
    }
  }
}

async function main() {
  for await (const arn of getAllLayerVersionArns()) {
    console.log(arn);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
