function clearChangeOutKits() {
  const ui = SpreadsheetApp.getUi();
  const confirmation = ui.alert(
    "Clear Selection?",
    "Are you sure you want to clear your current kits?",
    ui.ButtonSet.YES_NO
  );

  if (confirmation !== ui.Button.YES) {
    ui.alert("Operation canceled.");
    return;
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Change Out Kits");

  if (!sheet) {
    ui.alert("Change Out Kits tab not found.");
    return;
  }

  // Clear E4:F of the Change Out Kits tab
  sheet.getRange("E4:F" + sheet.getLastRow()).clearContent();
  ui.alert("Pending Materials Cleared");
}
