#!/usr/bin/env -S tsx
import {
  CognitoIdentityClient,
  paginateListIdentityPools,
} from "@aws-sdk/client-cognito-identity";
import { getResourceIdsOfType } from "../utils/stackInfo";
import { categorizeManagement } from "../utils/categorization";

const client = new CognitoIdentityClient({ region: "us-east-1" });

export async function audit() {
  const label = "Cognito Identity Pools";
  const { unmanagedIds, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllIdentityPools()),
    managedResourceIds: await getResourceIdsOfType("AWS::Cognito::IdentityPool"),
  });
  const deleteCommands = unmanagedIds.map(
    (id) => `aws cognito-identity delete-identity-pool --identity-pool-id ${id}`,
  );
  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

export async function* getAllIdentityPools() {
  for await (const page of paginateListIdentityPools({ client }, { MaxResults: 60 })) {
    yield* page.IdentityPools!.map(pool => pool.IdentityPoolId!)
  }
}

async function main() {
  for await (const id of getAllIdentityPools()) {
    console.log(id);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
