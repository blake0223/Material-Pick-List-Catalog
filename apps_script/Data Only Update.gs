function copyDataOnly() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Confirmation', 'Copy data only?', ui.ButtonSet.YES_NO);

  if (response == ui.Button.NO) {
    return; // Stop if user says no
  }

  // Open the master sheet
  var masterSheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1kgGvJRr5fTTG31LzxuGIvOSeuXWoHudVko-VYJCHpWI/edit');
  var materialSheet = masterSheet.getSheetByName("Material Input");
  var wizardSheet = masterSheet.getSheetByName("Update Wizard");

  var salesmenData = wizardSheet.getRange("A2:C").getValues();

  var sourceRange = materialSheet.getDataRange();
  var sourceValues = sourceRange.getValues(); // Only values

  salesmenData.forEach(function(row, index) {
    var name = row[0];
    var fileUrl = row[2]; // Get the URL

    if (name && fileUrl) {
      try {
        var targetSs = SpreadsheetApp.openByUrl(fileUrl);
        var targetSheet = targetSs.getSheetByName("Material Input");

        if (targetSheet) {
          targetSheet.clear(); // Clear current content
          var targetRange = targetSheet.getRange(1, 1, sourceValues.length, sourceValues[0].length);
          targetRange.setValues(sourceValues); // Copy only values

          Logger.log("Copied values for " + name);
        }
      } catch (e) {
        Logger.log("Error processing " + name + ": " + e.message);
      }
    }
  });
  SpreadsheetApp.getUi().alert('Data copied.');
}
