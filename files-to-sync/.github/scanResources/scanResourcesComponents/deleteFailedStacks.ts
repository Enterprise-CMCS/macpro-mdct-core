import * as cloudFormation from "../cloudFormation";

export async function audit () {
  const label = "CloudFormation Stacks in DELETE_FAILED State";
  const unmanaged = await cloudFormation.getDeleteFailedStacks();
  const deleteCommands = unmanaged.map(cloudFormation.deleteStackCommand);
  return {
    label,
    unmanaged,
    ignoreCounts: {},
    deleteCommands,
  }
}