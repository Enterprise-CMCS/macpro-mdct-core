#!/usr/bin/env -S tsx
import fs from "node:fs";
import { getAccountIdentifier } from "./utils";
import * as apiGateway from "./scanResourcesComponents/apiGateway";
import * as cloudFrontCachePolicy from "./scanResourcesComponents/cloudFrontCachePolicy";
import * as cloudFrontDistribution from "./scanResourcesComponents/cloudFrontDistribution";
import * as cloudFrontOriginAccessControl from "./scanResourcesComponents/cloudFrontOriginAccessControl";
import * as cloudFrontResponseHeadersPolicy from "./scanResourcesComponents/cloudFrontResponseHeadersPolicy";
import * as cloudWatchLogs from "./scanResourcesComponents/cloudWatchLogs";
import * as cognitoIdentityPool from "./scanResourcesComponents/cognitoIdentityPool";
import * as cognitoUserPool from "./scanResourcesComponents/cognitoUserPool";
import * as deleteFailedStacks from "./scanResourcesComponents/deleteFailedStacks";
import * as dynamoDb from "./scanResourcesComponents/dynamoDb";
import * as eni from "./scanResourcesComponents/eni";
import * as eventsRule from "./scanResourcesComponents/eventsRule";
import * as iamRole from "./scanResourcesComponents/iamRole";
import * as kmsKey from "./scanResourcesComponents/kmsKey";
import * as lambdaFunction from "./scanResourcesComponents/lambdaFunction";
import * as lambdaLayers from "./scanResourcesComponents/lambdaLayers";
import * as orphanedStacks from "./scanResourcesComponents/orphanedStacks";
import * as s3Buckets from "./scanResourcesComponents/s3Buckets";
import * as securityGroup from "./scanResourcesComponents/securityGroup";
import * as wafWebACL from "./scanResourcesComponents/wafWebACL";

let outputFile = "unmanaged-resources.txt";

type AuditResult = {
  /** A human-readable name for this resource type. */
  label: string;

  /** The list of unmanaged resource IDs of this type */
  unmanaged: string[];

  /** How many existing resources were managed or ignored, for what reasons? */
  ignoreCounts: Record<string, number>;

  /** The necessary AWS CLI commands to delete the unmanaged resources */
  deleteCommands: string[];
} | {
  /** A message explaining why the audit was not performed */
  warning: string
};

function log(line: string = "") {
  console.log(line);
  fs.appendFileSync(outputFile, line + "\n");
}

async function main() {
  const accountIdentifier = await getAccountIdentifier();
  outputFile = `unmanaged-resources-${accountIdentifier}.txt`;
  fs.writeFileSync(outputFile, "");
  console.log(`Writing scan results to ${outputFile}`);

  const resourceTypeAudits: (() => Promise<AuditResult>)[] = [
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
      return;
    }

    const { label, unmanaged, ignoreCounts, deleteCommands } = result;
    const ignored = Object.values(ignoreCounts).reduce((sum, x) => sum + x, 0);
    const totalCount = unmanaged.length + ignored;
    
    log(`${label} (total: ${totalCount})`);
    for (const [reason, count] of Object.entries(ignoreCounts)) {
      log(`${reason}: ${count}`);
    }
    
    if (unmanaged.length === 0) {
      log("✅ All are managed by CloudFormation or safe to ignore.\n");
    } else {
      log("❌ Unmanaged (or DELETE_FAILED):");
      for (const resourceId of unmanaged) {
        log(`- ${resourceId}`);
      }
      log();

      allDeleteCommands.push(
        `Delete ${label} (${unmanaged.length} resources)`,
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
