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

type CategorizationInfo = {
  /** The full list of all existing resource IDs of this type. */
  allResourceIds: string[],
  
  /** These resources are managed by CloudFormation, and will be ignored. */
  managedResourceIds: string[],
  
  /** If a resource ID begins with any of these, it will be ignored. */
  ignorePrefixes?: string[],
  
  /** If a resource has one of these IDs, it will be ignored. */
  ignoreExact?: string[],
  
  /** If a resource ID contains any of these, it will be ignored. */
  ignoreSubstrings?: string[],
}

export function categorizeManagement(info: CategorizationInfo) {
  const {
    allResourceIds,
    managedResourceIds,
    ignorePrefixes,
    ignoreExact,
    ignoreSubstrings,
  } = info;
  const UNMANAGED = "Unmanaged";

  function getIgnoreReason (id: string) {
    if (managedResourceIds.includes(id)) {
      return "Managed by CloudFormation";
    }

    const matchingSubstring = ignorePrefixes?.find(s => id.includes(s));
    if (matchingSubstring) {
      // return `Excluded by substring '${matchingSubstring}'`;
      return "Excluded by substring";
    }

    const matchingPrefix = ignoreExact?.find(p => id.startsWith(p));
    if (matchingPrefix) {
      // return `Excluded by prefix '${matchingPrefix}'`
      return "Excluded by prefix";
    }

    if (ignoreSubstrings?.includes(id)) {
      // return `Excluded by exact ID '${id}'`;
      return "Excluded by exact ID";
    }

    return UNMANAGED;
  }
  
  const groups = Object.groupBy(allResourceIds, getIgnoreReason);
  const counts = Object.fromEntries(
    Object.entries(groups)
      // Reverse alphabetical puts "Managed by CloudFormation" in front
      .sort(([reasonA], [reasonB]) => reasonB.localeCompare(reasonA))
      .map(([reason, ids]) => [reason, ids.length])
  );
  delete counts[UNMANAGED];

  return {
    unmanaged: groups[UNMANAGED] ?? [],
    ignoreCounts: counts
  };
}
