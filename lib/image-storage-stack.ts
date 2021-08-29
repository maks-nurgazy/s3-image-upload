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

/* Local dependencies */
import { ImageStorageProps } from "./stack-props";

export class ImageStorageStack extends Stack {
  constructor(scope: Construct, id: string, props: ImageStorageProps) {
    super(scope, id);

    const { mainImagesBucketName, thumbnailImagesBucketName, projectName } =
      props;

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
    const myRole = new Role(this, `${projectName}LambdaRole`, {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    myRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    const viewerRequestLambda = new lambda.Function(
      this,
      `${projectName}ViewerRequestLambda`,
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: "viewer-request.handler",
        code: lambda.Code.fromAsset("viewer-request"),
        memorySize: 128,
        role: myRole,
        environment: {
          region: "us-east-1",
        },
      }
    );

    const originResponseLambda = new lambda.Function(
      this,
      `${projectName}OriginResponseLambda`,
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: "origin-response.handler",
        code: lambda.Code.fromAsset("origin-response"),
        memorySize: 256,
        role: myRole,
        environment: {
          region: "us-east-1",
        },
      }
    );
    /* End of Edge Lambda*/

    /* creating Cloudfront distrubution */
    // new Distribution(this, `${projectName}ImagesCloudFrontDistribution`, {
    //   defaultBehavior: {
    //     origin: new S3Origin(mainImagesBucket),
    //     viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //     edgeLambdas: [
    //       {
    //         functionVersion: viewerRequestLambda.currentVersion,
    //         eventType: LambdaEdgeEventType.VIEWER_REQUEST,
    //       },
    //       {
    //         functionVersion: originResponseLambda.currentVersion,
    //         eventType: LambdaEdgeEventType.ORIGIN_RESPONSE,
    //       },
    //     ],
    //   },
    //   comment: `CloudFront Distribution for ${projectName}.`,
    // });
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
