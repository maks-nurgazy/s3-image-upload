import { S3Code } from "@aws-cdk/aws-lambda";

// dependencies
const AWS = require("aws-sdk");
const util = require("util");
const sharp = require("sharp");

// get reference to S3 client
const s3 = new AWS.S3();

exports.handler = async (event: any, context: any, callback: any) => {
  // Read options from the event parameter.
  const request = event.Records[0].cf.request;
  const headers = request.headers;
  const origin = request.origin;

  const originA = "medcheck-originals.s3.amazonaws.com";
  const originB = "medcheck-medium.s3.amazonaws.com";

  console.log(request);
  console.log(headers);
  console.log(origin);

  console.log(request.querystring);

  let origimage = null;

  try {
    const params = {
      Bucket: "medcheck-originals",
      Key: "lowimage.png",
    };

    origimage = await s3.getObject(params).promise();
  } catch (error) {
    console.log(error);

    return;
  }

  // set thumbnail width. Resize will set the height automatically to maintain aspect ratio.
  const width = 200;

  // Use the sharp module to resize the image and save in a buffer.

  try {
    let buffer = await sharp(origimage.Body).resize(width).toBuffer();

    try {
      const destparams = {
        Bucket: "medcheck-medium",
        Key: `medium-lowimage.png`,
        Body: buffer,
        ContentType: "image",
      };

      const putResult = await s3.putObject(destparams).promise();
    } catch (error) {
      console.log(error);
      return;
    }
  } catch (error) {
    console.log(error);
    return;
  }

  headers["host"] = [{ key: "host", value: originB }];
  origin.s3.domainName = originB;

  callback(null, request);
};
