import {
  AnyPrincipal,
  Effect,
  ManagedPolicy,
  PolicyStatement,
  PrincipalBase,
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
import { EdgeFunction } from "@aws-cdk/aws-cloudfront/lib/experimental/edge-function";
import * as lambda from "@aws-cdk/aws-lambda";
import { join } from "path";

export class CustomStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /* Creating Bucket */

    const originalBucketName = "medcheck-originals";
    const mediumBucketName = "medcheck-medium";

    const originalImageBucket = new Bucket(this, "medcheck-originals", {
      bucketName: originalBucketName,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const medcheckMedium = new Bucket(this, "medcheck-medium", {
      bucketName: mediumBucketName,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    originalImageBucket.addToResourcePolicy(
      this.getBucketPermissions(originalBucketName)
    );
    medcheckMedium.addToResourcePolicy(
      this.getBucketPermissions(mediumBucketName)
    );

    /* End of Bucket  creation*/

    /* Creating Edge Lambda function*/

    const myRole = new Role(this, "My Role", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    /*
    f the stack is in us-east-1, a "normal" lambda.Function can be used instead of an EdgeFunction.
    If you want to use EdgeFunction then uncomment below line and comment myFunc lambda function


    const myFunc = new cloudfront.experimental.EdgeFunction(this, 'MyFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-handler')),
      role: myRole
    });
  */

    const viewRequestFunc = new lambda.Function(this, "ViewerRequestFunc", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "request.handler",
      code: lambda.Code.fromAsset(join(__dirname, "lambda-handler")),
      memorySize: 128,
      role: myRole,
    });

    const originResponseFunc = new lambda.Function(this, "OriginRequestFunct", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "response.handler",
      code: lambda.Code.fromAsset(join(__dirname, "lambda-handler")),
      memorySize: 128,
      role: myRole,
    });

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
