type CategorizationInfo = {
  /** The full list of all existing resource IDs of this type. */
  allResourceIds: string[],
  
  /** These resources are managed by CloudFormation, and will be ignored. */
  managedResourceIds: string[],
  
  /** If a resource ID begins with any of these, it will be ignored. */
  ignoredPrefixes?: string[],
  
  /** If a resource has one of these IDs, it will be ignored. */
  ignoredIds?: string[],
  
  /** If a resource ID contains any of these, it will be ignored. */
  ignoredSubstrings?: string[],
}

/**
 * Which resources are unmanaged? How many are being ignored, for what reasons?
 */
export function categorizeManagement(info: CategorizationInfo) {
  const {
    allResourceIds,
    managedResourceIds,
    ignoredPrefixes,
    ignoredIds,
    ignoredSubstrings,
  } = info;
  const UNMANAGED = "Unmanaged";

  function getIgnoreReason (id: string) {
    if (managedResourceIds.includes(id)) {
      return "Managed by CloudFormation";
    }

    const matchingSubstring = ignoredPrefixes?.find(s => id.includes(s));
    if (matchingSubstring) {
      // return `Excluded by substring '${matchingSubstring}'`;
      return "Excluded by substring";
    }

    const matchingPrefix = ignoredIds?.find(p => id.startsWith(p));
    if (matchingPrefix) {
      // return `Excluded by prefix '${matchingPrefix}'`
      return "Excluded by prefix";
    }

    if (ignoredSubstrings?.includes(id)) {
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
    unmanagedIds: groups[UNMANAGED] ?? [],
    ignoreCounts: counts
  };
}
