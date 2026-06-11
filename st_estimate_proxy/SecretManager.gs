/**
 * SecretManager.gs  (ServiceTitan Estimate Proxy)
 *
 * Reads a tenant's credential JSON from GCP Secret Manager — the SAME secrets the
 * inventory trackers use (project "inventory-scripts", secrets named "wms-<tenant>").
 * This proxy is multi-tenant: the secret name is chosen per request, not per project.
 *
 * Auth: the proxy runs under the same GCP project as the trackers, so the deploying
 * owner's ScriptApp.getOAuthToken() (cloud-platform scope) is used directly — no
 * service-account key. The owner must have the "Secret Manager Secret Accessor" role
 * on the wms-* secrets (same access the trackers run under).
 *
 * This file mirrors the trackers' SecretManager.gs pattern but does NOT touch them.
 */

var GCP_PROJECT_ID_ = 'inventory-scripts';

// In-memory cache for one execution, keyed by secret name.
var _secretCache_ = {};

/**
 * Fetch + parse a tenant's credential blob from Secret Manager.
 * @param {string} secretName e.g. "wms-bell-mechanical"
 * @return {Object} parsed JSON credentials
 */
function getTenantConfig_(secretName) {
  if (_secretCache_[secretName]) return _secretCache_[secretName];

  var token = ScriptApp.getOAuthToken();
  var url = 'https://secretmanager.googleapis.com/v1/projects/' +
    encodeURIComponent(GCP_PROJECT_ID_) +
    '/secrets/' + encodeURIComponent(secretName) +
    '/versions/latest:access';

  var resp = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });

  var code = resp.getResponseCode();
  if (code !== 200) {
    throw new Error(
      'Secret Manager fetch failed for "' + secretName + '": HTTP ' + code + ' — ' +
      resp.getContentText() + '. Check the secret exists and the proxy owner has ' +
      'Secret Manager Secret Accessor on project ' + GCP_PROJECT_ID_ + '.'
    );
  }

  var body = JSON.parse(resp.getContentText());
  var decoded = Utilities.newBlob(Utilities.base64Decode(body.payload.data)).getDataAsString();

  var cfg;
  try {
    cfg = JSON.parse(decoded);
  } catch (e) {
    throw new Error('Secret "' + secretName + '" value is not valid JSON.');
  }

  _secretCache_[secretName] = cfg;
  return cfg;
}

/** Required credential getter — throws if missing/blank. */
function cfgGet_(cfg, key) {
  var v = cfg[key];
  if (v === undefined || v === null || String(v).trim() === '') {
    throw new Error('Missing credential "' + key + '" in the tenant secret.');
  }
  return String(v).trim();
}

/** Optional credential getter — returns default if missing/blank. */
function cfgGetOr_(cfg, key, dflt) {
  var v = cfg[key];
  if (v === undefined || v === null || String(v).trim() === '') {
    return dflt !== undefined ? dflt : '';
  }
  return String(v).trim();
}
