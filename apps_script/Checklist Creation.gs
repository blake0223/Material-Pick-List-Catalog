function generateChecklist() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var input = ss.getSheetByName('Material Input');
  if (!input) {
    SpreadsheetApp.getUi().alert('Sheet "Material Input" not found.');
    return;
  }

  // — Generate or replace the Checklist sheet —
  var old = ss.getSheetByName('Checklist');
  if (old) ss.deleteSheet(old);
  var cl = ss.insertSheet('Checklist');
  cl.appendRow(['Category', 'Name', 'Quantity', 'Done']);

  // Pull in everything from col-E/J/O/T (cat), F/K/P/U (name), G/L/Q/V (qty)
  var lastInputRow = input.getLastRow();
  if (lastInputRow < 2) {
    SpreadsheetApp.getUi().alert('No data to process.');
    return;
  }
  var data = input.getRange(2, 1, lastInputRow - 1, 22).getValues();
  var catCols  = [5, 10, 15, 20];
  var nameCols = [6, 11, 16, 21];
  var qtyCols  = [7, 12, 17, 22];

  // Build the sheet output
  var output = [];
  data.forEach(function(row) {
    for (var i = 0; i < catCols.length; i++) {
      var q = row[qtyCols[i] - 1];
      if (typeof q === 'number' && q > 0) {
        output.push([
          row[catCols[i] - 1],
          row[nameCols[i] - 1],
          q,
          false
        ]);
      }
    }
  });
  if (output.length === 0) {
    SpreadsheetApp.getUi().alert('No positive quantities found.');
    return;
  }

  // Write it, add checkboxes, borders, auto-resize
  cl.getRange(2, 1, output.length, 4).setValues(output);
  cl.getRange(2, 4, output.length, 1).insertCheckboxes();
  var lastRow = cl.getLastRow();
  cl.getRange(1, 1, lastRow, 4)
    .setBorder(true, true, true, true, true, true);
  for (var c = 1; c <= 4; c++) cl.autoResizeColumn(c);

  // Grab the displayed (string) values for print
  var tableValues = cl.getRange(1,1,lastRow,4).getDisplayValues();

  // Show an HTML dialog that renders exactly that table and auto-prints
  var tpl = HtmlService.createTemplateFromFile('PrintChecklist');
  tpl.values = tableValues;
  var html = tpl.evaluate()
    .setWidth(800).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, 'Print Checklist');
}
