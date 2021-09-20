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
      console.log("Before getting s3 image...");

      const originalImage = await s3Client
        .getObject({ Bucket: "bts-main-images-bucket", Key: originalKey })
        .promise();

      console.log("image meta data: " + originalImage.Metadata);

      console.log("before image resizing");

      /*
      cover: (default) Preserving aspect ratio, ensure the image covers both provided
            dimensions by cropping/clipping to fit.
      contain: Preserving aspect ratio, contain within both
            provided dimensions using "letterboxing" where necessary.
      fill: Ignore the aspect ratio of the input and stretch
            to both provided dimensions.
      inside: Preserving aspect ratio, resize the image to be as large
             as possible while ensuring its dimensions are less than or equal to both those specified.
      outside: Preserving aspect ratio, resize the image to be as small as
             possible while ensuring its dimensions are greater than or equal to both those specified.
      */
      const resizedImage = await sharp(originalImage.Body)
        .resize(width, height, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 0.5 },
        })
        .toFormat(extension);

      console.log("printing resizedImage");
      console.log(JSON.stringify(resizedImage));

      console.log("before image BUFFERING");

      const bufferedImage = await resizedImage.toBuffer();

      console.log("Before image PUTOBJECT");

      const putParams: PutObjectRequest = {
        Body: bufferedImage,
        Bucket: "bts-thumbnail-images-bucket",
        ContentType: `image/${extension}`,
        CacheControl: "max-age=31536000",
        Key: `images/${width}x${height}/${imageName}.${extension}`,
        StorageClass: "STANDARD",
      };

      console.log("after putting images");

      await s3Client.putObject(putParams).promise();

      // NOT WORKING CODE...
      var headers = response.headers;
      console.log(headers);

      response.status = "200";
      response.statusDescription = "OK";
      response.body = bufferedImage.toString("base64");
      response.bodyEncoding = "base64";
      if (response.headers)
        response.headers["content-type"] = [
          { key: "Content-Type", value: "image/" + extension },
        ];

      console.log("Response is ready");

      return response;
    } catch (e: any) {
      console.log("EROROR occuress...");
      console.log(e);
    }
  }

  console.log("outer return ishtep ketti ...................................");
  return response;
};
