/* External dependencies */
import { IVpc, SubnetSelection } from '@aws-cdk/aws-ec2';
import { CfnParametersCode, IFunction } from '@aws-cdk/aws-lambda';
import { Construct, Stack } from '@aws-cdk/core';

export class LambdaAPIConstruct extends Construct {
  public code: CfnParametersCode;
  public lambda: IFunction;
}

export interface LambdaAPIProps {
  environment: {
    [key: string]: string;
  };
  functionName: string;
  memorySize?: number;
  vpc?: IVpc;
  vpcSubnets?: SubnetSelection;
}

export class LambdaAPIStack extends Stack {
  public cfnParametersCode: CfnParametersCode;
}

export type LambdaAPIStacks = LambdaAPIStack[];
