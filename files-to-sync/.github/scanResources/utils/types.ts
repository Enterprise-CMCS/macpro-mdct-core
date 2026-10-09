type AuditResult = {
  /** A human-readable name for this resource type. */
  label: string;

  /** The list of unmanaged resource IDs of this type */
  unmanagedIds: string[];

  /** How many existing resources were managed or ignored, for what reasons? */
  ignoreCounts: Record<string, number>;

  /** The necessary AWS CLI commands to delete the unmanaged resources */
  deleteCommands: string[];
} | {
  /** A message explaining why the audit was not performed */
  warning: string
};

export type AuditFunction = () => Promise<AuditResult>;
