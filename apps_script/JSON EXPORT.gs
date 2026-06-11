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