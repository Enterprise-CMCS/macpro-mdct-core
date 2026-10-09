/*
 * Why doesn't AWS provide these paginators themselves? We don't know.
 */
import {
  CloudFrontClient,
  ListCachePoliciesCommand,
  ListCachePoliciesCommandInput,
  ListResponseHeadersPoliciesCommand,
  ListResponseHeadersPoliciesCommandInput,
} from "@aws-sdk/client-cloudfront";
import {
  EventBridgeClient,
  ListRulesCommand,
  ListRulesCommandInput
} from "@aws-sdk/client-eventbridge";
import {
  ListWebACLsCommand,
  ListWebACLsCommandInput,
  WAFV2Client
} from "@aws-sdk/client-wafv2";

export async function* cloudFront_paginateListCachePolicies (
  { client }: { client: CloudFrontClient },
  input: Omit<ListCachePoliciesCommandInput, "Marker">
) {
  let Marker: string | undefined;
  do {
    const response = await client.send(new ListCachePoliciesCommand({ ...input, Marker }));
    yield response;
    Marker = response.CachePolicyList?.NextMarker;
  } while (Marker);
}

export async function* cloudFront_paginateListResponseHeadersPolicies(
  { client }: { client: CloudFrontClient },
  input: Omit<ListResponseHeadersPoliciesCommandInput, "Marker">
) {
  let Marker: string | undefined;
  do {
    const response = await client.send(new ListResponseHeadersPoliciesCommand({ ...input, Marker }));
    yield response;
    Marker = response.ResponseHeadersPolicyList?.NextMarker;
  } while (Marker);
}

export async function* eventBridge_paginateListRulesCommand(
  { client }: { client: EventBridgeClient },
  input: Omit<ListRulesCommandInput, "NextToken">
) {
  let NextToken: string | undefined;
  do {
    const response = await client.send(new ListRulesCommand({ ...input, NextToken }));
    yield response;
    NextToken = response.NextToken;
  } while (NextToken);
}

export async function* waf_paginateListWebAcls (
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
