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

const Sharp = require("sharp");

const s3Client = new S3();

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
    const extension: string = match[5] == "jpg" ? "jpeg" : match[5];

    console.log(prefix);
    console.log(width);
    console.log(height);
    console.log(imageName);
    console.log(extension);
    const originalKey = `${prefix}/${imageName}.${extension}`;
    console.log(originalKey);
    const ORIGINAL_BUCKET = "bts-main-images-bucket";
    const STORE_BUCKET = "bts-thumbnail-images-bucket";
    const storeKey = `images/${width}x${height}/${imageName}.${extension}`;
    console.log(storeKey);

    s3Client
      .getObject({ Bucket: ORIGINAL_BUCKET, Key: originalKey })
      .promise()
      // perform the resize operation
      .then((x) => (console.log("after getObject s3:", x), x))
      .then((data) =>
        Sharp(data.Body).resize(width, height).toFormat(extension).toBuffer()
      )
      .then((buffer) => {
        // save the resized object to S3 bucket with appropriate object key.
        s3Client
          .putObject({
            Body: buffer,
            Bucket: STORE_BUCKET,
            ContentType: "image/" + extension,
            CacheControl: "max-age=31536000",
            Key: storeKey,
            StorageClass: "STANDARD",
          })
          .promise()
          .then((x) => (console.log("after putObject", x), x))
          // even if there is exception in saving the object we send back the generated
          // image back to viewer below
          .catch(() => {
            console.log("Exception while writing resized image to bucket");
          });

        // generate a binary response with resized image
        response.status = "200";
        response.body = buffer.toString("base64");
        response.bodyEncoding = "base64";
        response.headers = {
          "content-type": [
            { key: "Content-Type", value: "image/" + extension },
          ],
        };
        return response;
      })
      .catch((err) => {
        console.log("Exception while reading source image :%j", err);
      });
  }

  return response;
};
