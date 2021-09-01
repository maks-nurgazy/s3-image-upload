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

  // const params: ParsedUrlQuery = parse(request.querystring);
  // console.log("in viewer request");
  // console.log(request);
  // console.log(params);

  // let imageUri = request.uri;

  // if (!params.d) {
  //   return request;
  // }

  // const dimensionMatch = params.d.toString().split("x");

  // let width = parseInt(dimensionMatch[0]);
  // let height = parseInt(dimensionMatch[1]);

  // const match = imageUri.match(/(.*)\/(.*)\.(.*)/);

  // if (match != null) {
  //   let prefix = match[1];
  //   let imageName = match[2];
  //   let extension = match[3];

  //   let matchFound = false;

  //   let variancePercent = variables.variance / 100;

  //   for (let dimension of variables.allowedDimension) {
  //     let minWidth = dimension.w - dimension.w * variancePercent;
  //     let maxWidth = dimension.w + dimension.w * variancePercent;
  //     if (width >= minWidth && width <= maxWidth) {
  //       width = dimension.w;
  //       height = dimension.h;
  //       matchFound = true;
  //       break;
  //     }
  //   }

  //   if (!matchFound) {
  //     width = variables.defaultDimension.w;
  //     height = variables.defaultDimension.h;
  //   }

  //   let url = [];
  //   url.push(prefix);
  //   url.push(width + "x" + height);

  //   url.push(imageName + "." + extension);

  //   imageUri = url.join("/");
  //   return request;
  //   // request.uri = imageUri;
  // }

  return request;
};
