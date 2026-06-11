/**
 * Estimates.gs  (ServiceTitan Estimate Proxy)
 *
 * Pulls a ServiceTitan estimate and returns only its Equipment + Material lines,
 * normalized for the Material List sheet. Sales API: /sales/v2/tenant/{t}/estimates.
 *
 * Item shape returned to callers:
 *   { type: "Equipment"|"Material", code, name, qty, total }
 */

var WANTED_TYPES_ = { Equipment: true, Material: true };

/**
 * @param {string} secretName  e.g. "wms-bell-mechanical"
 * @param {Object} cfg          resolved tenant credentials
 * @param {Object} opts         { estimateId } or { jobNumber }
 * @return {Object} { estimateId, name, status, items:[...], counts:{Equipment,Material} }
 */
function getEstimateEquipmentAndMaterials_(secretName, cfg, opts) {
  var t = cfgGet_(cfg, 'ST_TENANT_ID');
  var base = '/sales/v2/tenant/' + t + '/estimates';

  var estimate = null;

  if (opts.estimateId) {
    // Pull via list?ids= so the response reliably includes the items array.
    var byId = stFetch_(secretName, cfg, 'get', base + '?ids=' + encodeURIComponent(opts.estimateId));
    estimate = firstRow_(byId);
    if (!estimate) {
      // Fall back to the single-resource endpoint.
      estimate = stFetch_(secretName, cfg, 'get', base + '/' + encodeURIComponent(opts.estimateId));
    }
    if (!estimate) throw new Error('Estimate ' + opts.estimateId + ' not found.');

  } else if (opts.jobNumber) {
    // Resolve job number -> job id, then list active estimates on that job.
    var jobs = stFetch_(secretName, cfg, 'get',
      '/jpm/v2/tenant/' + t + '/jobs?number=' + encodeURIComponent(opts.jobNumber));
    var job = firstRow_(jobs);
    if (!job) throw new Error('No job found for number ' + opts.jobNumber + '.');

    var ests = stFetch_(secretName, cfg, 'get', base + '?jobId=' + job.id + '&active=True');
    var rows = (ests && ests.data) || [];
    if (!rows.length) throw new Error('No estimates found on job ' + opts.jobNumber + '.');
    // Prefer a sold estimate, else the most recently modified.
    estimate = pickBestEstimate_(rows);

  } else {
    throw new Error('Provide an estimateId or a jobNumber.');
  }

  var items = estimate.items || [];
  // If the list response omitted items, fetch them from the items sub-resource.
  if (!items.length && estimate.id) {
    items = fetchEstimateItems_(secretName, cfg, t, estimate.id);
  }

  var out = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var sku = it.sku || {};
    var type = String(sku.type || '');
    if (WANTED_TYPES_[type]) {
      out.push({
        type: type,
        code: String(sku.name || ''),
        name: String(sku.displayName || ''),
        qty: it.qty != null ? it.qty : 0,
        total: it.total != null ? it.total : null
      });
    }
  }

  return {
    estimateId: String(estimate.id || opts.estimateId || ''),
    name: String(estimate.name || ''),
    status: estimate.status && estimate.status.value ? String(estimate.status.value) : '',
    items: out,
    counts: {
      Equipment: out.filter(function (x) { return x.type === 'Equipment'; }).length,
      Material: out.filter(function (x) { return x.type === 'Material'; }).length
    }
  };
}

/** Pages through /estimates/{id}/items and returns the raw item array. */
function fetchEstimateItems_(secretName, cfg, tenantId, estimateId) {
  var all = [];
  var page = 1;
  var pageSize = 200;
  while (true) {
    var resp = stFetch_(secretName, cfg, 'get',
      '/sales/v2/tenant/' + tenantId + '/estimates/' + estimateId +
      '/items?page=' + page + '&pageSize=' + pageSize);
    var rows = (resp && resp.data) || [];
    all = all.concat(rows);
    if (!resp || rows.length < pageSize || resp.hasMore === false) break;
    if (page++ > 25) break; // hard stop
  }
  return all;
}

function firstRow_(resp) {
  if (!resp) return null;
  if (resp.data && resp.data.length) return resp.data[0];
  if (resp.id) return resp; // single-resource response
  return null;
}

function pickBestEstimate_(rows) {
  var sold = rows.filter(function (r) { return r.soldOn; });
  var pool = sold.length ? sold : rows;
  pool.sort(function (a, b) {
    return new Date(b.modifiedOn || b.createdOn || 0) - new Date(a.modifiedOn || a.createdOn || 0);
  });
  return pool[0];
}
