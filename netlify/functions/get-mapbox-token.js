const JSON_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: JSON_HEADERS, body: '' };
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Method not allowed.' }) };
  }

  const token = process.env.MAPBOX_ACCESS_TOKEN || '';
  return {
    statusCode: token ? 200 : 200,
    headers: JSON_HEADERS,
    body: JSON.stringify({ token, configured: Boolean(token) })
  };
};
