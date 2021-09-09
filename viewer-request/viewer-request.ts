import { match } from "assert";
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

exports.handler = async (event: CloudFrontRequestEvent) => {
  const request: CloudFrontRequest = event.Records[0].cf.request;

  // querystring => d=300x300
  // after parse params will be => {d: '300x300'}
  const params: ParsedUrlQuery = parse(request.querystring);

  // fetch the uri of original image
  const imageUri: string = request.uri;

  const dimension = params.d?.toString();

  // if request query parameters not provided, then use default dimensions.
  if (!dimension) {
    return "/images/200x200/lowimage.png";
  }

  // 300x300
  const dimenMatch = dimension.match(/(\d+)x(\d+)/);

  // If incorrect Dimension provided.
  if (dimenMatch == null) {
    return "/images/200x200/lowimage.png";
  }

  let width: number = parseInt(dimenMatch[1]);
  let height: number = parseInt(dimenMatch[2]);

  // /images/lowimage.png
  const uriMatch = imageUri.match(/(.*)\/(.*)\.(.*)/);

  // If incorrect URI provided.
  if (uriMatch == null) {
    return "/images/200x200/lowimage.png";
  }

  let prefix: string = uriMatch[1];
  let imageName: string = uriMatch[2];
  let extension: string = uriMatch[3];

  let matchFound = false;

  let variancePercent = variables.variance / 100;

  for (let dimension of variables.allowedDimension) {
    let minWidth = dimension.w - dimension.w * variancePercent;
    let maxWidth = dimension.w + dimension.w * variancePercent;
    if (width >= minWidth && width <= maxWidth) {
      width = dimension.w;
      height = dimension.h;
      matchFound = true;
      break;
    }
  }

  // if no match is found from allowed dimension with variance then set to default
  //dimensions.
  if (!matchFound) {
    width = variables.defaultDimension.w;
    height = variables.defaultDimension.h;
  }

  let url = [];

  const resUri = `${prefix}/${width}x${height}/${imageName}.${extension}`;

  console.log(resUri);

  // URI must start with `/` slash
  request.uri = resUri;

  return request;
};
