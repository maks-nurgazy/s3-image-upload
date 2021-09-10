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

  console.log(JSON.stringify(response));

  if (response.status == "403" || response.status == "404") {
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
    const extension: string = match[5];

    const originalKey = `${prefix}/${imageName}.${extension}`;

    try {
      const originalImage = await s3Client
        .getObject({ Bucket: "bts-main-images-bucket", Key: originalKey })
        .promise();

      const resizedImage = await sharp(originalImage.Body)
        .resize(width, height)
        .toFormat(extension)
        .toBuffer();

      const putParams: PutObjectRequest = {
        Body: resizedImage.Body,
        Bucket: "bts-thumbnail-images-bucket",
        ContentType: `image/${extension}`,
        CacheControl: "max-age=31536000",
        Key: `images/${width}x${height}/${imageName}.${extension}`,
        StorageClass: "STANDARD",
      };

      s3Client.putObject(putParams).promise();

      response.status = "200";
      response.body = resizedImage.Body?.toString("base64");
      response.bodyEncoding = "base64";
      const headers: CloudFrontHeaders = {
        "content-type": [{ key: "Content-Type", value: `image/${extension}` }],
      };
      response.headers = headers;

      return response;
    } catch (e: any) {
      console.log(e);
    }
  }

  return response;
};
