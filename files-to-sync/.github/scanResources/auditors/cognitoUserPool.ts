#!/usr/bin/env -S tsx
import {
  CognitoIdentityProviderClient,
  paginateListUserPools,
} from "@aws-sdk/client-cognito-identity-provider";
import { getResourceIdsOfType } from "../utils/stackInfo";
import { categorizeManagement } from "../utils/categorization";

const client = new CognitoIdentityProviderClient({ region: "us-east-1" });

export async function audit() {
  const label = "Cognito User Pools";
  const { unmanagedIds, ignoreCounts } = categorizeManagement({
    allResourceIds: await Array.fromAsync(getAllUserPools()),
    managedResourceIds: await getResourceIdsOfType("AWS::Cognito::UserPool")
  });
  const deleteCommands = unmanagedIds.map(
    (id) => `aws cognito-idp delete-user-pool --user-pool-id ${id}`
  )
  return { label, unmanagedIds, ignoreCounts, deleteCommands };
}

export async function* getAllUserPools() {
  for await (const page of paginateListUserPools({ client }, { MaxResults: 60 })) {
    yield* page.UserPools!.map(pool => pool.Id!)
  }
}

async function main() {
  for await (const id of getAllUserPools()) {
    console.log(id);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
