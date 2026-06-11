function copySelectedTabsToTargetURLs() {
  const html = HtmlService.createHtmlOutputFromFile('SheetSelector')
    .setWidth(300)
    .setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(html, 'Select Tabs to Copy');
}

function getSheetNames() {
  const masterFile = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/1kgGvJRr5fTTG31LzxuGIvOSeuXWoHudVko-VYJCHpWI/edit");
  return masterFile.getSheets().map(sheet => sheet.getName());
}

function copySheetsToTargets(selectedSheets) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const wizardSheet = ss.getSheetByName("Update Wizard");
  const urls = wizardSheet.getRange("C2:C").getValues().flat().filter(url => url);
  const masterFile = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/1kgGvJRr5fTTG31LzxuGIvOSeuXWoHudVko-VYJCHpWI/edit");

  selectedSheets.forEach(sheetName => {
    const sheet = masterFile.getSheetByName(sheetName);
    if (sheet) {
      urls.forEach(url => {
        const targetFile = SpreadsheetApp.openByUrl(url);
        const existingSheet = targetFile.getSheetByName(sheetName);
        if (existingSheet) {
          targetFile.deleteSheet(existingSheet);
        }
        const sheetCopy = sheet.copyTo(targetFile);
        sheetCopy.setName(sheetName);
      });
    }
  });
}
