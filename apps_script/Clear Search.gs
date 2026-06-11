function clearSearch() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Material Input');
  if (!sheet) return;

  sheet.getRange('C26').setValue('');
  sheet.getRange('C28').setValue('');
  sheet.getRange('C32').clearContent();

  SpreadsheetApp.getUi().alert('Search Cleared.');
}