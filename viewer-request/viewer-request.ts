import {
  CloudFrontHeaders,
  CloudFrontRequest,
  CloudFrontRequestEvent,
} from "aws-lambda";
import { ParsedUrlQuery, parse } from "querystring";

const variables = {
  allowedDimension: [
    { w: 100, h: 100 },
    { w: 200, h: 200 },
    { w: 300, h: 300 },
    { w: 400, h: 400 },
  ],
  defaultDimension: { w: 200, h: 200 },
  variance: 20,
};

exports.handler = (event: CloudFrontRequestEvent) => {
  const request: CloudFrontRequest = event.Records[0].cf.request;
  console.log(request);

  return request;
};
