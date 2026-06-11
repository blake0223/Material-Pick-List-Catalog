function applyKitListUpdate() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Confirmation', 'Launch Kit List update?', ui.ButtonSet.YES_NO);
  
  if (response == ui.Button.NO) {
    return; // Stop if the user says no
  }

  // Open the master sheet
  var masterSheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1kgGvJRr5fTTG31LzxuGIvOSeuXWoHudVko-VYJCHpWI/edit');
  var kitListSource = masterSheet.getSheetByName("Kit Lists");
  
  if (!kitListSource) {
    Logger.log("Error: 'Kit Lists' tab not found in the master sheet.");
    return;
  }

  var sourceData = kitListSource.getDataRange().getValues();
  var sourceColumnWidths = [];
  for (var col = 1; col <= kitListSource.getLastColumn(); col++) {
    sourceColumnWidths.push(kitListSource.getColumnWidth(col));
  }

  // Retrieve the salesmen details from the "Update Wizard" tab in the master sheet
  var wizardSheet = masterSheet.getSheetByName("Update Wizard");
  var salesmenData = wizardSheet.getRange("A2:C").getValues(); // Assuming data starts at row 2, columns A (names) and C (URLs)

  // Loop through each salesman's file
  salesmenData.forEach(function(row) {
    var name = row[0].trim(); // Salesman's name from column A, trimmed to avoid extra spaces
    var fileUrl = row[2]; // File URL of the salesman's sheet from column C

    if (name && fileUrl) {
      try {
        Logger.log("Processing " + name + " with file URL: " + fileUrl);

        // Open the target spreadsheet
        var targetSs = SpreadsheetApp.openByUrl(fileUrl);
        var kitListTarget = targetSs.getSheetByName("Kit Lists");

        if (!kitListTarget) {
          kitListTarget = targetSs.insertSheet("Kit Lists");
        }

        var targetRange = kitListTarget.getRange(1, 1, sourceData.length, sourceData[0].length);
        targetRange.setValues(sourceData); // Overwrite data
        
        // Match column widths
        for (var col = 1; col <= sourceColumnWidths.length; col++) {
          kitListTarget.setColumnWidth(col, sourceColumnWidths[col - 1]);
        }

        // Protect the sheet from edits except for authorized users
        var protection = kitListTarget.protect();
        protection.setDescription("Protected Kit Lists");
        protection.removeEditors(protection.getEditors()); // Remove all editors
        protection.setWarningOnly(false); // Fully protect the sheet
        
        // Hide the sheet
        kitListTarget.hideSheet();

        Logger.log("Successfully updated 'Kit Lists' tab for " + name);
      } catch (e) {
        Logger.log("Error processing " + name + ": " + e.message);
      }
    } else {
      Logger.log("Error: Missing file URL for '" + name + "'.");
    }
  });

  // Set the most recent run date in F3 of the "Update Wizard" tab
  wizardSheet.getRange("F3").setValue(new Date());
  
  SpreadsheetApp.getUi().alert("Kit List update applied to all target sheets successfully.");
}
