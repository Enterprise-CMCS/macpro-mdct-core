#!/usr/bin/env -S tsx
import { WAFV2Client, Scope as WafScope } from "@aws-sdk/client-wafv2";
import { getResourceIdsOfType } from "../utils/stackInfo";
import { paginateListWebAcls } from "../utils/customPaginators/wafv2";
import { categorizeManagement } from "../utils/categorization";

const client = new WAFV2Client({ region: "us-east-1" });

export async function audit() {
  const label = "WAFv2 WebACLs (REGIONAL & CLOUDFRONT)";
  const { unmanagedIds, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllWafv2WebACLsCfnIds()),
    managedResourceIds: await getResourceIdsOfType("AWS::WAFv2::WebACL"),
    ignoredPrefixes: ["FMManagedWebACLV2-cms-cloud"],
  });
  const deleteCommands = unmanagedIds.map((id) => `aws wafv2 delete-web-acl --id ${id} --scope <REGIONAL|CLOUDFRONT> --lock-token <token>`);
  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

export async function* getAllWafv2WebACLsCfnIds() {
  for (const Scope of [WafScope.REGIONAL, WafScope.CLOUDFRONT]) {
    for await (const page of paginateListWebAcls({ client }, { Scope })) {
      yield* page.WebACLs!.map(w => `${w.Name}|${w.Id}|${Scope}`)
    }
  }
}

async function main() {
  for await (const id of getAllWafv2WebACLsCfnIds()) {
    console.log(id);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
