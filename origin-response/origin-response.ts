import {
  CloudFrontResponseEvent,
  CloudFrontResponse,
  CloudFrontRequest,
  CloudFrontResultResponse,
  CloudFrontHeaders,
} from "aws-lambda";
import { S3 } from "aws-sdk";
import { GetObjectOutput, PutObjectRequest } from "aws-sdk/clients/s3";
import { ParsedUrlQuery, parse } from "querystring";

const sharp = require("sharp");

const s3Client = new S3({
  signatureVersion: "v4",
});

exports.handler = async (event: CloudFrontResponseEvent) => {
  let response: CloudFrontResultResponse = event.Records[0].cf.response;
  console.log("origin response begin: " + JSON.stringify(response));

  if (response.status == "403" || response.status == "404") {
    console.log("IF STatement triggered");
    let request: CloudFrontRequest = event.Records[0].cf.request;
    const imageUri: string = request.uri.substring(1);

    const match = imageUri.match(/(.*)\/(\d+)x(\d+)\/(.*)\.(.*)/);

    // Invalid request.
    if (match == null) {
      response.body = "Image not found";
      response.bodyEncoding = "text";
      return response;
    }

    const prefix: string = match[1];
    const width: number = parseInt(match[2]);
    const height: number = parseInt(match[3]);
    const imageName: string = match[4];
    const extension: string = match[5] == "jpg" ? "jpeg" : match[5];

    const originalKey = `${prefix}/${imageName}.${extension}`;

    try {
      const originalImage = await s3Client
        .getObject({ Bucket: "bts-main-images-bucket", Key: originalKey })
        .promise();

      console.log("image meta data: " + originalImage.Metadata);

      const resizedImage = await sharp(originalImage.Body)
        .resize(width, height)
        .toFormat(extension)
        .toBuffer();

      console.log("Image resized");

      console.log(JSON.stringify(resizedImage));

      const putParams: PutObjectRequest = {
        Body: resizedImage,
        Bucket: "bts-thumbnail-images-bucket",
        ContentType: `image/${extension}`,
        CacheControl: "max-age=31536000",
        Key: `images/${width}x${height}/${imageName}.${extension}`,
        StorageClass: "STANDARD",
      };

      console.log("after putting images");

      await s3Client.putObject(putParams).promise();

      response.body = resizedImage.toString("base64");
      response.bodyEncoding = "base64";

      return response;
    } catch (e: any) {
      console.log(e);
    }
  }

  return response;
};
