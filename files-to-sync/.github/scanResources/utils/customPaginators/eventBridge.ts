import {
  EventBridgeClient,
  ListRulesCommand,
  ListRulesCommandInput,
} from "@aws-sdk/client-eventbridge";

export async function* paginateListRulesCommand(
  { client }: { client: EventBridgeClient },
  input: Omit<ListRulesCommandInput, "NextToken">
) {
  let NextToken: string | undefined;
  do {
    const response = await client.send(
      new ListRulesCommand({ ...input, NextToken })
    );
    yield response;
    NextToken = response.NextToken;
  } while (NextToken);
}
