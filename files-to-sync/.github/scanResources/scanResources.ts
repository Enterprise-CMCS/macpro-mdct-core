#!/usr/bin/env -S tsx
import fs from "node:fs";
import { getAccountIdentifier } from "./utils/identity";
import type { AuditFunction } from "./utils/types";
import * as apiGateway from "./auditors/apiGateway";
import * as cloudFrontCachePolicy from "./auditors/cloudFrontCachePolicy";
import * as cloudFrontDistribution from "./auditors/cloudFrontDistribution";
import * as cloudFrontOriginAccessControl from "./auditors/cloudFrontOriginAccessControl";
import * as cloudFrontResponseHeadersPolicy from "./auditors/cloudFrontResponseHeadersPolicy";
import * as cloudWatchLogs from "./auditors/cloudWatchLogs";
import * as cognitoIdentityPool from "./auditors/cognitoIdentityPool";
import * as cognitoUserPool from "./auditors/cognitoUserPool";
import * as deleteFailedStacks from "./auditors/deleteFailedStacks";
import * as dynamoDb from "./auditors/dynamoDb";
import * as eni from "./auditors/eni";
import * as eventsRule from "./auditors/eventsRule";
import * as iamRole from "./auditors/iamRole";
import * as kmsKey from "./auditors/kmsKey";
import * as lambdaFunction from "./auditors/lambdaFunction";
import * as lambdaLayers from "./auditors/lambdaLayers";
import * as orphanedStacks from "./auditors/orphanedStacks";
import * as s3Buckets from "./auditors/s3Buckets";
import * as securityGroup from "./auditors/securityGroup";
import * as wafWebACL from "./auditors/wafWebACL";

let outputFile = "unmanaged-resources.txt";

/** Log two places at once! Almost as if we invoked `| tee outputFile.txt` */
function log(line: string = "") {
  console.log(line);
  fs.appendFileSync(outputFile, line + "\n");
}

/** Run the audit for each resource type, aggregating the output. */
async function main() {
  const accountIdentifier = await getAccountIdentifier();
  outputFile = `unmanaged-resources-${accountIdentifier}.txt`;
  fs.writeFileSync(outputFile, "");
  console.log(`Writing scan results to ${outputFile}`);

  const resourceTypeAudits: AuditFunction[] = [
    deleteFailedStacks.audit,
    orphanedStacks.audit,
    apiGateway.audit,
    cloudFrontCachePolicy.audit,
    cloudFrontDistribution.audit,
    cloudFrontOriginAccessControl.audit,
    cloudFrontResponseHeadersPolicy.audit,
    cloudWatchLogs.audit,
    cognitoIdentityPool.audit,
    cognitoUserPool.audit,
    dynamoDb.audit,
    eni.audit,
    eventsRule.audit,
    iamRole.audit,
    kmsKey.audit,
    lambdaFunction.audit,
    lambdaLayers.audit,
    s3Buckets.audit,
    securityGroup.audit,
    wafWebACL.audit
  ];

  const allDeleteCommands: string[] = [];

  for (let audit of resourceTypeAudits) {
    const result = await audit();
    if ("warning" in result) {
      log(`⚠️ ${result.warning}`);
      continue;
    }

    const { label, unmanagedIds, ignoreCounts, deleteCommands } = result;
    const ignored = Object.values(ignoreCounts).reduce((sum, x) => sum + x, 0);
    const totalCount = unmanagedIds.length + ignored;
    
    log(`${label} (total: ${totalCount})`);
    for (const [reason, count] of Object.entries(ignoreCounts)) {
      log(`${reason}: ${count}`);
    }
    
    if (unmanagedIds.length === 0) {
      log("✅ All are managed by CloudFormation or safe to ignore.\n");
    } else {
      log("❌ Unmanaged (or DELETE_FAILED):");
      for (const resourceId of unmanagedIds) {
        log(`- ${resourceId}`);
      }
      log();

      allDeleteCommands.push(
        `Delete ${label} (${unmanagedIds.length} resources)`,
        ...deleteCommands,
        "",
      );
    }
  }

  if (allDeleteCommands.length > 0) {
    const deleteScriptFile = outputFile.replace(".txt", "-delete-commands.txt");
    fs.writeFileSync(deleteScriptFile, [
        "# AWS CLI commands to delete unmanaged resources",
        "# Generated: " + new Date().toISOString(),
        "",
        "⚠️  IMPORTANT SAFETY WARNINGS:",
        "1. MANUALLY VERIFY each resource before running its delete command",
        "2. Run commands INDIVIDUALLY, one at a time - DO NOT run all at once",
        "3. Confirm each resource is truly unmanaged and safe to delete",
        "4. Remove the '#' prefix from each command before executing",
        "",
        // Comment all nonempty lines to prevent bulk execution of commands
        ...allDeleteCommands.map(line => line.length > 0 ? `# ${line}` : line),
      ].join("\n")
    );

    log(`\nAWS CLI delete commands written to: ${deleteScriptFile}`);
    log(
      "⚠️ WARNING: Manually verify each resource and run commands individually!"
    );
  }

  console.log(`Scan complete. See ${outputFile}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
