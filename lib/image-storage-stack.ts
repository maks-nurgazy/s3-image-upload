/* External dependencies */
import {
  AnyPrincipal,
  Effect,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "@aws-cdk/aws-iam";
import { Bucket } from "@aws-cdk/aws-s3";
import {
  Distribution,
  LambdaEdgeEventType,
  ViewerProtocolPolicy,
} from "@aws-cdk/aws-cloudfront";
import { Construct, RemovalPolicy, Stack } from "@aws-cdk/core";
import { S3Origin } from "@aws-cdk/aws-cloudfront-origins";
import * as lambda from "@aws-cdk/aws-lambda";
import { join } from "path";

/* Local dependencies */
import { ImageStorageProps } from "./stack-props";

export class ImageStorageStack extends Stack {
  constructor(scope: Construct, id: string, props: ImageStorageProps) {
    super(scope, id);

    const { mainImagesBucketName, thumbnailImagesBucketName } = props;

    /* Creating Bucket */
    const mainImagesBucket = new Bucket(this, mainImagesBucketName, {
      bucketName: mainImagesBucketName,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const thumbnailImagesBucket = new Bucket(this, thumbnailImagesBucketName, {
      bucketName: thumbnailImagesBucketName,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    mainImagesBucket.addToResourcePolicy(
      this.getBucketPermissions(mainImagesBucketName)
    );
    thumbnailImagesBucket.addToResourcePolicy(
      this.getBucketPermissions(thumbnailImagesBucketName)
    );
    /* End of Bucket  creation*/

    /* Creating Lambda function*/
    const myRole = new Role(this, "My Role", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    myRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    const viewRequestFunc = new lambda.Function(this, "ViewerRequestFunction", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "request.handler",
      code: lambda.Code.fromAsset("viewer-request"),
      memorySize: 128,
      role: myRole,
    });

    const originResponseFunc = new lambda.Function(
      this,
      "OriginRequestFunction",
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: "response.handler",
        code: lambda.Code.fromAsset("origin-response"),
        memorySize: 256,
        role: myRole,
      }
    );
    /* End of Edge Lambda*/

    /* creating Cloudfront distrubution */
    new Distribution(this, "MedcheckCloudFrontDistribution", {
      defaultBehavior: {
        origin: new S3Origin(mainImagesBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        edgeLambdas: [
          {
            functionVersion: viewRequestFunc.currentVersion,
            eventType: LambdaEdgeEventType.VIEWER_REQUEST,
          },
          {
            functionVersion: originResponseFunc.currentVersion,
            eventType: LambdaEdgeEventType.ORIGIN_RESPONSE,
          },
        ],
      },

      comment: `CloudFront Distribution for ${mainImagesBucketName}.`,
    });
    /* End of creation Cloudfront distrubution */
  }

  private getBucketPermissions(bucketName: string): PolicyStatement {
    return new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [new AnyPrincipal()],
      actions: ["s3:GetObject", "s3:PutObject", "s3:GetObjectVersion"],
      resources: [`arn:aws:s3:::${bucketName}/*`],
    });
  }
}
