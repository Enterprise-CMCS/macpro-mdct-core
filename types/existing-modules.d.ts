/**
 * These are files that exist in the repos that are being synced but not in this report.
 * By declaring them here we can get typescript to stop throwing `TS2307: Cannot find module`
 * errors, in a spot where we know that's the case and is our intention.
 */
declare module "*/deployment-config.ts";
declare module "*/parent.ts";
declare module "*/utils.ts";
