/* External dependencies */
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";

/* Local dependencies */
import { ImageStorageStack } from "../lib/image-storage-stack";

const app = new cdk.App();

const MAIN_IMAGES_BUCKET_NAME = "bts-main-images-bucket";
const THUMBNAIL_IMAGES_BUCKET_NAME = "bts-thumbnail-images-bucket";

new ImageStorageStack(app, "ImageStorageStack", {
  mainImagesBucketName: MAIN_IMAGES_BUCKET_NAME,
  thumbnailImagesBucketName: THUMBNAIL_IMAGES_BUCKET_NAME,
  projectName: "BTS",
});
