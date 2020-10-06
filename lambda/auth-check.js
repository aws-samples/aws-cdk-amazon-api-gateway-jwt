//
// This is a quite simple lambda function.
// Since we check the authentication in API Gateway layer, this function just returns the success message.
//
exports.handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ auth: 'ok' }),
  };
};
