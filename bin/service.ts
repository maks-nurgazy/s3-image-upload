#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { ImageStorageStack } from "../lib/image-storage-stack";

const app = new cdk.App();

const MAIN_IMAGES_BUCKET_NAME = "main-images-bucket";
const THUMBNAIL_IMAGES_BUCKET_NAME = "thumbnail-images-bucket";

new ImageStorageStack(app, "ImageStorageStack", {
  mainImagesBucketName: MAIN_IMAGES_BUCKET_NAME,
  thumbnailImagesBucketName: THUMBNAIL_IMAGES_BUCKET_NAME,
  projectName: "BTS",
});

// env: { account: "680553899128", region: "us-east-1" },
