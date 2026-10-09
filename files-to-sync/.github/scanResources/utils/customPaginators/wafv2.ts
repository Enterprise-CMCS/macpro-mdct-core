import {
  ListWebACLsCommand,
  ListWebACLsCommandInput,
  WAFV2Client
} from "@aws-sdk/client-wafv2";

export async function* paginateListWebAcls (
  { client }: { client: WAFV2Client },
  input: Omit<ListWebACLsCommandInput, "NextMarker">
) {
  let NextMarker: string | undefined;
  do {
    const response = await client.send(new ListWebACLsCommand({ ...input, NextMarker }));
    yield response;
    NextMarker = response.NextMarker;
  } while (NextMarker);
}
