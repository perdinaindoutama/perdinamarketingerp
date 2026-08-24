export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, accessToken, sessionId, dbId } = req.body || {};

    if (!accessToken) {
      return res.status(401).json({ s: false, error: 'Access token required' });
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
        const { host, endpoint, params, httpMethod, body: apiBody } = req.body;
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
        return res.status(400).json({ s: false, error: 'Unknown action: ' + action });
    }

    const fetchOptions = { method, headers: authHeaders };
    if (reqBody) fetchOptions.body = reqBody;

    const resp = await fetch(url, fetchOptions);
    const text = await resp.text();

    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return res.status(resp.status).json(data);

  } catch (err) {
    return res.status(500).json({ s: false, error: err.message });
  }
}
