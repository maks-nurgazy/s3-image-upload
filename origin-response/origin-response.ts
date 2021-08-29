exports.handler = (event: any) => {
  let response = event.Records[0].cf.response;

  return response;
};
