exports.handler = (event: any) => {
  const request = event.Records[0].cf.request;

  return request;
};
