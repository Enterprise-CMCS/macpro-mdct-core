#!/usr/bin/env -S tsx
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { getResourceIds } from "../utils/stackInfo";
import { paginateListRulesCommand } from "../utils/customPaginators/eventBridge";
import { classifyResources } from "../utils/categorization";
import { ResourceTypes } from "../utils/types";

const client = new EventBridgeClient({ region: "us-east-1" });

export async function audit () {
  const label = "Event Rules";
  const { unmanagedIds, ignoreCounts } = classifyResources({
    allResourceIds: await Array.fromAsync(getAllEventRules()),
    managedIds: await getResourceIds(ResourceTypes.EventsRule),
    ignoredPrefixes: [
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
  const deleteCommands = unmanagedIds.flatMap((name) => [
    `aws events remove-targets --rule ${name} --ids $(aws events list-targets-by-rule --rule ${name} --query 'Targets[].Id' --output text)`,
    `aws events delete-rule --name ${name}`,
  ]);
  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

export async function* getAllEventRules() {
  for await (const page of paginateListRulesCommand({ client }, { Limit: 100 })) {
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
