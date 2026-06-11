function printGeneratedMaterialListPack() {
  var ui = SpreadsheetApp.getUi();

  // Initial confirmation dialog before proceeding
  var initialResponse = ui.alert('Confirmation', 'Are you sure you want to print the material list? This is intended for Warehouse use.', ui.ButtonSet.YES_NO);

  if (initialResponse == ui.Button.NO) {
    return; // Halt the function if the user selects NO
  }

  // Create an HTML dropdown dialog to select which material list to print
  var html = HtmlService.createHtmlOutput(
    '<div style="font-family: Arial, sans-serif;">' +
    '<b>WAIT A SEC AFTER PRESSING</b><br><br>' +
    '<label for="materialSelect">Select Material List:</label><br><br>' +
    '<select id="materialSelect">' +
    '<option value="main">Main Material List</option>' +
    '<option value="additional">Additional Material List</option>' +
    '</select><br><br>' +
    '<button onclick="google.script.run.withSuccessHandler(google.script.host.close).handlePrintMaterialSelection(document.getElementById(\'materialSelect\').value);">Confirm</button>' +
    '<button onclick="google.script.host.close()">Cancel</button>' +
    '</div>'
  ).setWidth(300).setHeight(220);

  ui.showModalDialog(html, 'Select Material List');
}

function handlePrintMaterialSelection(selection) {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet;
  var sheetName;

  if (selection === 'main') {
    sheet = ss.getSheetByName('Generated Material List');
    sheetName = 'Generated Material List';
  } else if (selection === 'additional') {
    sheet = ss.getSheetByName('Additional Material');
    sheetName = 'Additional Material';
  } else {
    ui.alert('Invalid selection. Please try again.');
    return;
  }

  if (!sheet) {
    Logger.log('Sheet "' + sheetName + '" not found');
    ui.alert('The selected sheet was not found.');
    return;
  }

  // Get the Google Sheet ID
  var ssId = ss.getId();
  var gid = sheet.getSheetId();

  // Construct a URL to open Google Sheets Print View in Landscape
  var printUrl = "https://docs.google.com/spreadsheets/d/" + ssId + "/export?format=pdf" +
                 "&size=A4" +
                 "&portrait=false" +  // Set portrait to false for landscape orientation
                 "&fitw=true" +
                 "&sheetnames=false" +
                 "&printtitle=false" +
                 "&pagenumbers=false" +
                 "&gridlines=false" +
                 "&fzr=false" +
                 "&top_margin=0.10" +
                 "&bottom_margin=0.10" +
                 "&left_margin=0.10" +
                 "&right_margin=0.10" +
                 "&gid=" + gid;

  // Open the print preview in a new window for the user to print manually
  var htmlOutput = HtmlService.createHtmlOutput(
    '<script>' +
    'window.open("' + printUrl + '");' +
    'google.script.host.close();' +
    '</script>'
  );
  ui.showModalDialog(htmlOutput, 'Print Material List');
}
