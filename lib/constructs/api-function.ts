/* External dependencies */
import {
  LambdaDeploymentConfig,
  LambdaDeploymentGroup,
} from "@aws-cdk/aws-codedeploy";
import { Alias, Code, Function, Runtime } from "@aws-cdk/aws-lambda";
import { CfnOutput, Construct } from "@aws-cdk/core";

/* Local dependencies */
import { LambdaAPIConstruct, LambdaAPIProps } from "./lambda-api";

export class APIFunction extends LambdaAPIConstruct {
  constructor(scope: Construct, id: string, props: LambdaAPIProps) {
    super(scope, id);

    const { environment, functionName, memorySize, vpc, vpcSubnets } = props;
    const functionNameCamelCase = functionName;
    const functionNameLowerCase = functionName.toLowerCase();
    this.code = Code.fromCfnParameters();

    const lambdaFunction = (this.lambda = new Function(this, `${id}Handler`, {
      runtime: Runtime.NODEJS_14_X,
      handler: `api/${functionNameLowerCase}/${functionNameLowerCase}-handler.handler`,
      description: `${functionNameCamelCase} function generated on: ${new Date().toISOString()}`,
      code: this.code,
      memorySize: memorySize || 256,
      environment,
      vpc,
      vpcSubnets,
    }));

    const alias = new Alias(this, "LambdaAlias", {
      aliasName: "Prod",
      version: lambdaFunction.currentVersion,
    });

    new LambdaDeploymentGroup(this, "DeploymentGroup", {
      alias,
      deploymentConfig: LambdaDeploymentConfig.LINEAR_10PERCENT_EVERY_1MINUTE,
    });

    // Prints out the Lambda function's ARN to the terminal
    const exportName = `${id}ARN`;
    new CfnOutput(this, exportName, {
      value: lambdaFunction.functionArn,
      exportName,
    });
  }
}
