/**
 * STAuth.gs  (ServiceTitan Estimate Proxy)
 *
 * ServiceTitan auth + fetch, mirroring the trackers' proven STAuth.gs pattern but
 * made multi-tenant: every function takes the resolved credential object so one
 * proxy can serve many tenants. Access tokens are cached in Script Properties,
 * keyed by secret name.
 *
 * Secret JSON keys used (same as the trackers): ST_CLIENT_ID, ST_CLIENT_SECRET,
 * ST_APP_KEY, ST_TENANT_ID, ST_ENV (production|integration).
 */

function stApiBase_(cfg) {
  return cfgGetOr_(cfg, 'ST_ENV', 'integration').toLowerCase() === 'production'
    ? 'https://api.servicetitan.io'
    : 'https://api-integration.servicetitan.io';
}

function stAuthBase_(cfg) {
  return cfgGetOr_(cfg, 'ST_ENV', 'integration').toLowerCase() === 'production'
    ? 'https://auth.servicetitan.io'
    : 'https://auth-integration.servicetitan.io';
}

/** Returns a valid ST access token for this tenant, caching it in Script Properties. */
function getSTToken_(secretName, cfg) {
  var props = PropertiesService.getScriptProperties();
  var now = Date.now();
  var buffer = 120000; // refresh 2 min before expiry

  var tk = props.getProperty('ST_TOKEN_' + secretName);
  var exp = Number(props.getProperty('ST_TOKEN_EXP_' + secretName) || 0);
  if (tk && (exp - now) > buffer) return tk;

  var resp = UrlFetchApp.fetch(stAuthBase_(cfg) + '/connect/token', {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: {
      grant_type: 'client_credentials',
      client_id: cfgGet_(cfg, 'ST_CLIENT_ID'),
      client_secret: cfgGet_(cfg, 'ST_CLIENT_SECRET')
    },
    muteHttpExceptions: true
  });

  if (resp.getResponseCode() !== 200) {
    throw new Error('ServiceTitan token request failed: HTTP ' + resp.getResponseCode() +
      ' — ' + resp.getContentText() + '. Check ST_CLIENT_ID / ST_CLIENT_SECRET in the secret.');
  }

  var d = JSON.parse(resp.getContentText());
  var ttlMs = (d.expires_in ? Number(d.expires_in) : 900) * 1000;
  props.setProperty('ST_TOKEN_' + secretName, d.access_token);
  props.setProperty('ST_TOKEN_EXP_' + secretName, String(Date.now() + ttlMs - 60000));
  return d.access_token;
}

function stHeaders_(secretName, cfg) {
  return {
    'Authorization': 'Bearer ' + getSTToken_(secretName, cfg),
    'Content-Type': 'application/json',
    'ST-App-Key': cfgGet_(cfg, 'ST_APP_KEY')
  };
}

/**
 * Authenticated ServiceTitan API GET/POST with 429/401/5xx retry, mirroring the
 * trackers' stApiFetch. Returns parsed JSON (or null for empty responses).
 */
function stFetch_(secretName, cfg, method, path, opts) {
  opts = opts || {};
  var url = (path.indexOf('http') === 0) ? path : (stApiBase_(cfg) + path);
  var maxTries = (opts.maxRetries != null ? opts.maxRetries : 3);
  var tryCount = 0;

  while (true) {
    tryCount++;
    var res = UrlFetchApp.fetch(url, {
      method: method.toUpperCase(),
      muteHttpExceptions: true,
      headers: stHeaders_(secretName, cfg)
    });
    var code = res.getResponseCode();
    var txt = res.getContentText();

    if (code >= 200 && code < 300) return txt ? JSON.parse(txt) : null;

    if (code === 429 && tryCount < maxTries) {
      var hdrs = res.getAllHeaders() || {};
      var ra = Number(String(hdrs['Retry-After'] || hdrs['retry-after'] || '').trim());
      Utilities.sleep((isNaN(ra) ? 10 : Math.min(ra, 30)) * 1000);
      continue;
    }
    if (code === 401 && tryCount === 1) {
      PropertiesService.getScriptProperties().deleteProperty('ST_TOKEN_' + secretName);
      continue;
    }
    if (code >= 500 && tryCount < maxTries) {
      Utilities.sleep(Math.min(1000 * Math.pow(2, tryCount), 16000));
      continue;
    }
    throw new Error('ServiceTitan API ' + method.toUpperCase() + ' ' + url +
      ' → HTTP ' + code + ': ' + txt);
  }
}
