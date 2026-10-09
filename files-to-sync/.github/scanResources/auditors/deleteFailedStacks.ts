import * as cloudFormation from "../utils/stackInfo";

export async function audit () {
  const label = "CloudFormation Stacks in DELETE_FAILED State";
  const unmanagedIds = await cloudFormation.getDeleteFailedStacks();
  const deleteCommands = unmanagedIds.map(cloudFormation.deleteStackCommand);
  return {
    label,
    unmanagedIds,
    ignoreCounts: {},
    deleteCommands,
  }
}