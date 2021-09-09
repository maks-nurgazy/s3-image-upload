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

  const BUCKET = "bts-thumbnail-images-bucket";

  console.log("Response status code :%s", response.status);

  if (response.status == "404") {
    let request: CloudFrontRequest = event.Records[0].cf.request;
    let params = parse(request.querystring);

    // if there is no dimension attribute, just pass the response
    if (!params.d) {
      return response;
    }

    // read the dimension parameter value = width x height and split it by 'x'
    let dimensionMatch = params.d.toString().split("x");

    // read the required path. Ex: uri /images/100x100/webp/image.jpg
    let path = request.uri;

    // read the S3 key from the path variable.
    // Ex: path variable /images/100x100/webp/image.jpg
    let key = path.substring(1);

    // parse the prefix, width, height and image name
    // Ex: key=images/image.jpg
    let prefix = "images",
      originalKey,
      match,
      width = 300,
      height = 300,
      requiredFormat = "jpg",
      imageName;
    let startIndex;

    try {
      match = key.match(/(.*)\/(.*)\.(.*)/);

      // correction for jpg required for 'Sharp'
      imageName = "lowimage.png";
      originalKey = prefix + "/" + imageName;
      console.log(requiredFormat);
      console.log(imageName);
      console.log(originalKey);
    } catch (err) {
      // no prefix exist for image..
      console.log("no prefix present..");

      // correction for jpg required for 'Sharp'
      imageName = "lowimage.png";
      originalKey = imageName;
    }

    // get the source image file
    s3Client
      .getObject({ Bucket: BUCKET, Key: originalKey })
      .promise()
      // perform the resize operation
      .then((x) => (console.log("after getObject s3:", x), x))
      .then((data) =>
        Sharp(data.Body)
          .resize(width, height)
          .toFormat(requiredFormat)
          .toBuffer()
      )
      .then((buffer) => {
        // save the resized object to S3 bucket with appropriate object key.
        s3Client
          .putObject({
            Body: buffer,
            Bucket: BUCKET,
            ContentType: "image/" + requiredFormat,
            CacheControl: "max-age=31536000",
            Key: key,
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
        const headers: CloudFrontHeaders = {
          "content-type": [
            { key: "Content-Type", value: "image/" + requiredFormat },
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
