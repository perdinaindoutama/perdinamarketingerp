// Netlify Function: accurate-proxy.js
// Acts as a CORS proxy between browser and Accurate Online API

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { action, accessToken, sessionId, dbId } = body;

    if (!accessToken) {
      return {
        statusCode: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ s: false, error: 'Access token required' })
      };
    }

    const authHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    let url = '';
    let method = 'GET';
    let reqBody = null;

    switch (action) {
      case 'db-list':
        url = 'https://account.accurate.id/api/db-list.do';
        break;

      case 'open-db':
        url = `https://account.accurate.id/api/open-db.do?id=${dbId}`;
        break;

      case 'check-session':
        url = `https://account.accurate.id/api/db-check-session.do?session=${sessionId}`;
        break;

      case 'refresh-session':
        url = `https://account.accurate.id/api/db-refresh-session.do?id=${dbId}&session=${sessionId}`;
        break;

      case 'api-call': {
        const { host, endpoint, params, httpMethod, body: apiBody } = body;
        let apiUrl = `${host}/accurate/api/${endpoint}`;
        method = httpMethod || 'GET';

        if (method === 'GET' && params) {
          const qs = new URLSearchParams(params).toString();
          if (qs) apiUrl += `?${qs}`;
        }

        authHeaders['X-Session-ID'] = sessionId;

        if (method === 'POST' && apiBody) {
          reqBody = new URLSearchParams(apiBody).toString();
        }
        url = apiUrl;
        break;
      }

      default:
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ s: false, error: 'Unknown action: ' + action })
        };
    }

    const fetchOptions = { method, headers: authHeaders };
    if (reqBody) fetchOptions.body = reqBody;

    const resp = await fetch(url, fetchOptions);
    const text = await resp.text();

    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    return {
      statusCode: resp.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ s: false, error: err.message })
    };
  }
};
