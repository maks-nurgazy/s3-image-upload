#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { ImageStorageStack } from "../lib/image-storage-stack";

const app = new cdk.App();
new ImageStorageStack(app, "ImageStorageStack", {
  env: { account: "680553899128", region: "us-east-1" },
});
