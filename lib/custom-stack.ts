import { AnyPrincipal, Effect, PolicyStatement, PrincipalBase } from "@aws-cdk/aws-iam";
import { Bucket } from "@aws-cdk/aws-s3";
import { Construct, RemovalPolicy, Stack, StackProps } from '@aws-cdk/core';


export class CustomStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

  /* Creating Bucket */

    const originalBucketName = 'medcheck-originals';
    const mediumBucketName = 'medcheck-medium';

    const originalImageBucket = new Bucket(this, "medcheck-originals", {
      bucketName: originalBucketName,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const medcheckMedium = new Bucket(this, "medcheck-medium", {
      bucketName: mediumBucketName,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    originalImageBucket.addToResourcePolicy(this.getBucketPermissions(originalBucketName));
    medcheckMedium.addToResourcePolicy(this.getBucketPermissions(mediumBucketName));

   /* End of Bucket  creation*/



  }

  private getBucketPermissions(bucketName: string): PolicyStatement {
    return new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [new AnyPrincipal()],
      actions: [
        's3:GetObject',
        's3:GetObjectVersion',
      ],
      resources: [
        `arn:aws:s3:::${bucketName}/*`,
      ]
    });
  }
}
