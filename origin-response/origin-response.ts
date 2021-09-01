import {
  CloudFrontResponseEvent,
  CloudFrontResponse,
  CloudFrontRequest,
  CloudFrontResultResponse,
} from "aws-lambda";
import { S3 } from "aws-sdk";
import { GetObjectOutput } from "aws-sdk/clients/s3";
import { ParsedUrlQuery, parse } from "querystring";

// const Sharp = require("sharp");

const s3Client = new S3({
  signatureVersion: "v4",
});

exports.handler = async (event: CloudFrontResponseEvent) => {
  let response: CloudFrontResultResponse = event.Records[0].cf.response;
  console.log(response);
  console.log("request in origin-response");
  console.log(event.Records[0].cf.request);

  return response;
};
