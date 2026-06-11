/**
 * Exports this Apps Script project's full source AND a snapshot of the
 * bound spreadsheet to a single JSON file in your Google Drive.
 *
 * SETUP (one-time):
 *  1. Visit https://script.google.com/home/usersettings and turn ON
 *     "Google Apps Script API".
 *  2. Run exportEverythingToJson() and authorize when prompted.
 */

// Max data rows to capture per sheet. -1 captures ALL rows (no cap).
var MAX_ROWS_PER_SHEET = -1;

function exportEverythingToJson() {
  var bundle = {
    exportedAt: new Date().toISOString(),
    code: exportProjectContent_(),
    spreadsheet: exportSpreadsheetSnapshot_()
  };

  var json = JSON.stringify(bundle, null, 2);
  var fileName = 'project-export-' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '.json';
  var file = DriveApp.createFile(fileName, json, MimeType.PLAIN_TEXT);

  Logger.log('Export complete!');
  Logger.log('Download URL: ' + file.getUrl());
  if (bundle.code) {
    Logger.log('Code files: ' + bundle.code.files.map(function (f) { return f.name; }).join(', '));
  }
  if (bundle.spreadsheet) {
    Logger.log('Sheets: ' + bundle.spreadsheet.sheets.map(function (s) {
      return s.name + ' (' + s.totalRows + 'x' + s.totalCols + ')';
    }).join(', '));
  }
  return file.getUrl();
}

/**
 * Builds the same export bundle and commits it straight to the GitHub repo at
 * reference/raw_export.json. A GitHub Action then splits it into the per-sheet
 * CSVs automatically — no manual download/upload.
 *
 * SETUP (one-time): in the Apps Script editor, open Project Settings (gear) ->
 * Script Properties, and add:
 *   GITHUB_TOKEN  = a fine-grained PAT scoped to this repo, Contents: Read+Write
 *   GITHUB_REPO   = blake0223/Material-Pick-List-Catalog   (optional; this is the default)
 *   GITHUB_BRANCH = main                                   (optional; default main)
 */
function exportToGitHub() {
  var props  = PropertiesService.getScriptProperties();
  var token  = props.getProperty('GITHUB_TOKEN');
  var repo   = props.getProperty('GITHUB_REPO')   || 'blake0223/Material-Pick-List-Catalog';
  var branch = props.getProperty('GITHUB_BRANCH') || 'main';
  var path   = 'reference/raw_export.json';

  if (!token) {
    throw new Error('Missing GITHUB_TOKEN. Add it in Project Settings -> Script Properties ' +
      '(a fine-grained PAT for this repo with Contents: Read and write).');
  }

  var bundle = {
    exportedAt: new Date().toISOString(),
    code: exportProjectContent_(),
    spreadsheet: exportSpreadsheetSnapshot_()
  };
  var json = JSON.stringify(bundle, null, 2);
  var contentB64 = Utilities.base64Encode(json, Utilities.Charset.UTF_8);

  var apiBase = 'https://api.github.com/repos/' + repo + '/contents/' + path;
  var headers = {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  // Look up the existing file's SHA (required to update, omitted to create).
  var sha = null;
  var getResp = UrlFetchApp.fetch(apiBase + '?ref=' + encodeURIComponent(branch), {
    method: 'get', headers: headers, muteHttpExceptions: true
  });
  if (getResp.getResponseCode() === 200) {
    sha = JSON.parse(getResp.getContentText()).sha;
  }

  var payload = {
    message: 'Auto-export: spreadsheet + code snapshot',
    content: contentB64,
    branch: branch
  };
  if (sha) { payload.sha = sha; }

  var putResp = UrlFetchApp.fetch(apiBase, {
    method: 'put',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (putResp.getResponseCode() >= 300) {
    throw new Error('GitHub commit failed (' + putResp.getResponseCode() + '): ' +
      putResp.getContentText());
  }

  SpreadsheetApp.getActiveSpreadsheet().toast('Synced export to GitHub (' + repo + ').');
  Logger.log('Committed ' + path + ' to ' + repo + '@' + branch);
}

/** Pulls all .gs/.html/manifest files via the Apps Script API. */
function exportProjectContent_() {
  var scriptId = ScriptApp.getScriptId();
  var token = ScriptApp.getOAuthToken();
  var url = 'https://script.googleapis.com/v1/projects/' + scriptId + '/content';
  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('Apps Script API call failed (' + response.getResponseCode() +
      '). Enable it at https://script.google.com/home/usersettings\n\n' +
      response.getContentText());
  }
  return JSON.parse(response.getContentText());
}

/** Snapshots every sheet: name, size, headers, and data. */
function exportSpreadsheetSnapshot_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    Logger.log('No bound spreadsheet found (is this script container-bound?).');
    return null;
  }

  var sheets = ss.getSheets().map(function (sheet) {
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var info = {
      name: sheet.getName(),
      totalRows: lastRow,
      totalCols: lastCol,
      frozenRows: sheet.getFrozenRows(),
      headers: [],
      rows: [],
      truncated: false
    };

    if (lastRow > 0 && lastCol > 0) {
      info.headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];

      var rowsToGet = (MAX_ROWS_PER_SHEET === -1)
        ? lastRow
        : Math.min(lastRow, MAX_ROWS_PER_SHEET);
      info.truncated = rowsToGet < lastRow;
      info.rows = sheet.getRange(1, 1, rowsToGet, lastCol).getDisplayValues();
    }
    return info;
  });

  return {
    name: ss.getName(),
    url: ss.getUrl(),
    id: ss.getId(),
    sheets: sheets,
    namedRanges: ss.getNamedRanges().map(function (nr) {
      return { name: nr.getName(), range: nr.getRange().getA1Notation() };
    })
  };
}