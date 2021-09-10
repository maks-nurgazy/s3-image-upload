import {
  CloudFrontResponseEvent,
  CloudFrontResponse,
  CloudFrontRequest,
  CloudFrontResultResponse,
  CloudFrontHeaders,
} from "aws-lambda";
import { S3 } from "aws-sdk";
import { GetObjectOutput } from "aws-sdk/clients/s3";
import { ParsedUrlQuery, parse } from "querystring";

const Sharp = require("sharp");

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
    } catch (e: any) {}

    const originalImage = await s3Client
      .getObject({ Bucket: "bts-main-images-bucket", Key: originalKey })
      .promise();
  }

  return response;
};
