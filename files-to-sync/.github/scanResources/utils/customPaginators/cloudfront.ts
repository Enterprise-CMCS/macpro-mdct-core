import {
  CloudFrontClient,
  ListCachePoliciesCommand,
  ListCachePoliciesCommandInput,
  ListResponseHeadersPoliciesCommand,
  ListResponseHeadersPoliciesCommandInput,
} from "@aws-sdk/client-cloudfront";

export async function* paginateListCachePolicies (
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

export async function* paginateListResponseHeadersPolicies(
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
