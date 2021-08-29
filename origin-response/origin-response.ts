import { CloudFrontResponseEvent, CloudFrontResponse } from "aws-lambda";

exports.handler = (event: CloudFrontResponseEvent) => {
  let response: CloudFrontResponse = event.Records[0].cf.response;

  if (response.status == "404") {
    console.log("No image found");
  } else {
    return response;
  }

  return response;
};
