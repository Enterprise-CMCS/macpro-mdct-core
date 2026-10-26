#!/usr/bin/env -S tsx
import { WAFV2Client, Scope as WafScope } from "@aws-sdk/client-wafv2";
import { getResourceIds } from "../utils/stackInfo";
import { paginateListWebAcls } from "../utils/customPaginators/wafv2";
import { classifyResources } from "../utils/categorization";
import { ResourceTypes } from "../utils/types";

const client = new WAFV2Client({ region: "us-east-1" });

export async function audit() {
  const label = "WAFv2 WebACLs (REGIONAL & CLOUDFRONT)";
  const { unmanagedIds, ignoreCounts } = classifyResources({
    allResourceIds: await Array.fromAsync(getAllWafv2WebACLsCfnIds()),
    managedIds: await getResourceIds(ResourceTypes.WebAcl),
    ignoredPrefixes: ["FMManagedWebACLV2-cms-cloud"],
  });
  const deleteCommands = unmanagedIds.map(
    (id) =>
      `aws wafv2 delete-web-acl --id ${id} --scope <REGIONAL|CLOUDFRONT> --lock-token <token>`
  );
  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

export async function* getAllWafv2WebACLsCfnIds() {
  for (const Scope of [WafScope.REGIONAL, WafScope.CLOUDFRONT]) {
    for await (const page of paginateListWebAcls({ client }, { Scope })) {
      yield* page.WebACLs!.map((w) => `${w.Name}|${w.Id}|${Scope}`);
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
