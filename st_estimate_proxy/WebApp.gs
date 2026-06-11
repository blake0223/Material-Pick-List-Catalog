/**
 * WebApp.gs  (ServiceTitan Estimate Proxy)
 *
 * Web App entry point. Deploy as: Execute as ME (the owner with Secret Manager
 * access), Access = Anyone. A shared key (?key=) gates every request.
 *
 * SETUP:
 *   1. setProxyKey('a-long-random-string')   // stores PROXY_API_KEY
 *   2. Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone
 *   3. Copy the /exec URL; hand the URL + key to the Material List sheet.
 *
 * REQUEST (GET):
 *   ?action=estimateItems&tenant=bell-mechanical&estimateId=229499692&key=...
 *   ?action=estimateItems&tenant=bell-mechanical&jobNumber=12345&key=...
 *   ?action=ping&key=...
 *
 * `tenant` maps to the Secret Manager secret "wms-<tenant>" (override with &secret=).
 *
 * RESPONSE:
 *   { ok:true, tenant, estimate:{ estimateId, name, status, items:[{type,code,name,qty,total}], counts } }
 *   { error:"...", code:### }   on failure
 */

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};

    var stored = PropertiesService.getScriptProperties().getProperty('PROXY_API_KEY');
    if (!stored) return json_({ error: 'Proxy not configured: set PROXY_API_KEY via setProxyKey().', code: 500 });
    if ((p.key || '') !== stored) return json_({ error: 'Unauthorized', code: 401 });

    var action = p.action || 'estimateItems';

    if (action === 'ping') {
      return json_({ ok: true, ts: new Date().toISOString() });
    }

    if (action !== 'estimateItems') {
      return json_({ error: 'Unknown action: ' + action, code: 400 });
    }

    var tenant = (p.tenant || '').trim();
    if (!tenant && !p.secret) return json_({ error: 'Missing tenant (e.g. tenant=bell-mechanical).', code: 400 });
    var secretName = (p.secret || ('wms-' + tenant)).trim();

    if (!p.estimateId && !p.jobNumber) {
      return json_({ error: 'Provide estimateId or jobNumber.', code: 400 });
    }

    var cfg = getTenantConfig_(secretName);
    var result = getEstimateEquipmentAndMaterials_(secretName, cfg, {
      estimateId: (p.estimateId || '').trim(),
      jobNumber: (p.jobNumber || '').trim()
    });

    return json_({ ok: true, tenant: tenant, secret: secretName, estimate: result });

  } catch (err) {
    return json_({ error: String(err && err.message || err), code: 500 });
  }
}

/** One-time: store the shared API key. */
function setProxyKey(key) {
  if (!key || String(key).length < 16) {
    throw new Error('Use a key of at least 16 characters.');
  }
  PropertiesService.getScriptProperties().setProperty('PROXY_API_KEY', String(key));
  Logger.log('PROXY_API_KEY set (length ' + String(key).length + ').');
}

/**
 * Editor smoke test — run this after provisioning to confirm Secret Manager +
 * ServiceTitan work end to end. Edit the tenant/estimate id as needed.
 */
function testEstimate() {
  var secretName = 'wms-bell-mechanical';
  var cfg = getTenantConfig_(secretName);
  var result = getEstimateEquipmentAndMaterials_(secretName, cfg, { estimateId: '229499692' });
  Logger.log('Estimate: ' + result.name + ' (' + result.estimateId + ')');
  Logger.log('Equipment: ' + result.counts.Equipment + '  Material: ' + result.counts.Material);
  result.items.slice(0, 10).forEach(function (i) {
    Logger.log('  [' + i.type + '] ' + i.code + ' x' + i.qty + '  — ' + i.name);
  });
  return result;
}

function json_(o) {
  return ContentService
    .createTextOutput(JSON.stringify(o, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}
