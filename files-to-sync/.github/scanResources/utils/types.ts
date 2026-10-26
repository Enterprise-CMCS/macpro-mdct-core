type AuditResult =
  | {
      /** A human-readable name for this resource type. */
      label: string;

      /** The list of unmanaged resource IDs of this type */
      unmanagedIds: string[];

      /** How many existing resources were managed or ignored, for what reasons? */
      ignoreCounts: Record<string, number>;

      /** The necessary AWS CLI commands to delete the unmanaged resources */
      deleteCommands: string[];
    }
  | {
      /** A message explaining why the audit was not performed */
      warning: string;
    };

export type AuditFunction = () => Promise<AuditResult>;

/** These are all of the Cloudfront resource types we audit. */
export const ResourceTypes = {
  RestApi: "AWS::ApiGateway::RestApi",
  CachePolicy: "AWS::CloudFront::CachePolicy",
  Distribution: "AWS::CloudFront::Distribution",
  OriginAccessControl: "AWS::CloudFront::OriginAccessControl",
  ResponseHeadersPolicy: "AWS::CloudFront::ResponseHeadersPolicy",
  IdentityPool: "AWS::Cognito::IdentityPool",
  UserPool: "AWS::Cognito::UserPool",
  DynamoDbTable: "AWS::DynamoDB::Table",
  NetworkInterface: "AWS::EC2::NetworkInterface",
  SecurityGroup: "AWS::EC2::SecurityGroup",
  EventsRule: "AWS::Events::Rule",
  IamManagedPolicy: "AWS::IAM::ManagedPolicy",
  IamPolicy: "AWS::IAM::Policy",
  IamRole: "AWS::IAM::Role",
  KmsAlias: "AWS::KMS::Alias",
  KmsKey: "AWS::KMS::Key",
  LambdaFunction: "AWS::Lambda::Function",
  LambdaLayerVersion: "AWS::Lambda::LayerVersion",
  LogGroup: "AWS::Logs::LogGroup",
  S3Bucket: "AWS::S3::Bucket",
  WebAcl: "AWS::WAFv2::WebACL",
} as const;

export type ResourceType = (typeof ResourceTypes)[keyof typeof ResourceTypes];

export function isResourceType(x: unknown): x is ResourceType {
  return Object.values(ResourceTypes).includes(x as any);
}
