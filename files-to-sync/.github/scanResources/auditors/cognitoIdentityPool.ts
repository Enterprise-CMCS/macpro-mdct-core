#!/usr/bin/env -S tsx
import {
  CognitoIdentityClient,
  paginateListIdentityPools,
} from "@aws-sdk/client-cognito-identity";
import { getResourceIds } from "../utils/stackInfo";
import { classifyResources } from "../utils/categorization";
import { ResourceTypes } from "../utils/types";

const client = new CognitoIdentityClient({ region: "us-east-1" });

export async function audit() {
  const label = "Cognito Identity Pools";
  const { unmanagedIds, ignoreCounts } = classifyResources({
    allResourceIds: await Array.fromAsync(getAllIdentityPools()),
    managedIds: await getResourceIds(ResourceTypes.IdentityPool),
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
