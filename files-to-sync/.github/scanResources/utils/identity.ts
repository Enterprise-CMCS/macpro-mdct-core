import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { IAMClient, ListAccountAliasesCommand } from "@aws-sdk/client-iam";

export async function getAccountId() {
  try {
    return (await new STSClient().send(new GetCallerIdentityCommand())).Account;
  } catch { }
}

async function getAccountAlias() {
  try {
    return (await new IAMClient().send(new ListAccountAliasesCommand())).AccountAliases?.[0];
  } catch { }
}

/**
 * The account alias, or account ID, or the fallback `"unknown-account"`.
 * Normalized to only includes alphanumerics, dashes, and underscores.
 */
export async function getAccountIdentifier() {
  return (
    await getAccountAlias() ||
    await getAccountId() ||
    "unknown-account"
  ).replaceAll(/[^a-zA-Z0-9-_]/g, "_");
}
