#!/usr/bin/env -S tsx
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { getResourceIdsOfType } from "../cloudFormation";
import { eventBridge_paginateListRulesCommand } from "../missingPaginators";
import { categorizeManagement } from "../utils";

const client = new EventBridgeClient({ region: "us-east-1" });

export async function audit () {
  const label = "Event Rules";
  const { unmanaged, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllEventRules()),
    managedResourceIds: await getResourceIdsOfType("AWS::Events::Rule"),
    ignorePrefixes: [
      "SSMExplorerManagedRule",
      "billing-alerts",
      "health-events",
      "custodian",
      "DO-NOT-DELETE",
      "CMS-Cloud",
      "cms-cloud",
      "Tenable",
    ],
  });
  const deleteCommands = unmanaged.flatMap((name) => [
    `aws events remove-targets --rule ${name} --ids $(aws events list-targets-by-rule --rule ${name} --query 'Targets[].Id' --output text)`,
    `aws events delete-rule --name ${name}`,
  ]);
  return { label, unmanaged, ignoreCounts, deleteCommands };
}

export async function* getAllEventRules() {
  for await (const page of eventBridge_paginateListRulesCommand({ client }, { Limit: 100 })) {
    yield* page.Rules!.map(rule => rule.Name!)
  }
}

async function main() {
  for await (const rule of getAllEventRules()) {
    console.log(rule);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
