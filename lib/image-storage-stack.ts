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
import { Construct, RemovalPolicy, Stack, StackProps } from "@aws-cdk/core";
import { S3Origin } from "@aws-cdk/aws-cloudfront-origins";
import * as lambda from "@aws-cdk/aws-lambda";
import { join } from "path";

export class ImageStorageStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /* Creating Bucket */
    const MAIN_IMAGES_BUCKET_NAME = "main-images-bucket";
    const THUMBNAIL_IMAGES_BUCKET_NAME = "thumbnail-images-bucket";

    const mainImagesBucket = new Bucket(this, MAIN_IMAGES_BUCKET_NAME, {
      bucketName: MAIN_IMAGES_BUCKET_NAME,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const thumbnailImagesBucket = new Bucket(
      this,
      THUMBNAIL_IMAGES_BUCKET_NAME,
      {
        bucketName: THUMBNAIL_IMAGES_BUCKET_NAME,
        removalPolicy: RemovalPolicy.DESTROY,
      }
    );

    mainImagesBucket.addToResourcePolicy(
      this.getBucketPermissions(MAIN_IMAGES_BUCKET_NAME)
    );
    thumbnailImagesBucket.addToResourcePolicy(
      this.getBucketPermissions(THUMBNAIL_IMAGES_BUCKET_NAME)
    );

    /* End of Bucket  creation*/

    /* Creating Edge Lambda function*/

    const myRole = new Role(this, "My Role", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

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

    myRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    // myRole.addManagedPolicy(
    //   ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonS3FullAccess")
    // );

    /* End of Edge Lambda*/

    /* creating Cloudfront distrubution */

    const cloudFrontDistribution = new Distribution(
      this,
      "MedcheckCloudFrontDistribution",
      {
        defaultBehavior: {
          origin: new S3Origin(originalImageBucket),
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

        comment: `CloudFront Distribution for ${originalImageBucket}.`,
      }
    );

    /* End of creation Cloudfront distrubution */
  }

  private getBucketPermissions(bucketName: string): PolicyStatement {
    return new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [new AnyPrincipal()],
      actions: ["s3:GetObject", "s3:GetObjectVersion"],
      resources: [`arn:aws:s3:::${bucketName}/*`],
    });
  }
}
