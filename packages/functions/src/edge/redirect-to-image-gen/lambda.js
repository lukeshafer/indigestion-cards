// @ts-check
'use strict';

/**
 * @param {AWSLambda.CloudFrontResponseEvent} event
 * @returns {Promise<AWSLambda.CloudFrontResponseResult>}
 */
async function handler(event) {
  const cf = event.Records[0].cf;
  const response = cf.response;
  console.log(response.status);
  console.log('Request', cf.request);

  if (Number(response.status) >= 400) {
    const apiUrlHeader = cf.request.headers['x-indi-image-api-url'];
    const apiUrl = apiUrlHeader[0].value;
    const s3Key = cf.request.uri;
    const query = cf.request.querystring.length > 0 ? '?' + cf.request.querystring : '';

    const location = apiUrl + '/cards' + s3Key + query;
    console.log('Redirecting', { apiUrl, s3Key, query, location, apiUrlHeader });

    return {
      status: '302',
      statusDescription: 'OK',
      headers: {
        ...response.headers,
        'cache-control': [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
        location: [
          {
            key: 'Location',
            value: location,
          },
        ],
      },
    };
  } else return response;

  //return {
  //...response,
  //headers: {
  //...response.headers,
  //},
  //};
}

exports.handler = handler;
