#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CustomStack } from '../lib/custom-stack';

const app = new cdk.App();
new CustomStack(app, 'CustomStack', {
  env: { account: '680553899128', region: 'us-east-1' },
});
