import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { runCommand } from "./runner.ts";
import { region } from "./consts.ts";

export const getCloudFormationStackOutputValues = async (
  stackName: string
): Promise<Record<string, string>> => {
  const client = new CloudFormationClient({ region });
  const command = new DescribeStacksCommand({ StackName: stackName });
  const response = await client.send(command);

  const stack = response.Stacks?.[0];
  const outputs = stack?.Outputs ?? [];

  return outputs.reduce((acc, output) => {
    if (output.OutputKey && output.OutputValue) {
      acc[output.OutputKey] = output.OutputValue;
    }
    return acc;
  }, {} as Record<string, string>);
};

export const runFrontendLocally = (stage: string) =>
  runCommand(
    "React locally",
    ["yarn", "dev", "--context", `stage=${stage}`],
    "services/ui-src"
  );
