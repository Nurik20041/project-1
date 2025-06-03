const fetch = require('node-fetch');

exports.handler = async function (event) {
  const { propertyId, startDate, endDate } = event.queryStringParameters;

  try {
    const res = await fetch(`https://apartx.co/api/v2/Tenant/Property/getAvailability?propertyId=${propertyId}&startDate=${startDate}&endDate=${endDate}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': 'Xd9ZXqCTM2fgT6N7A',
        'X-API-SECRET': 'BIunTsYnKjJnRSGj5_6s_zv6RLX1_3VuwWaeQ79m7ObHpcFY'
      }
    });

    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
