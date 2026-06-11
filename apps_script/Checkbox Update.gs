function copyCheckboxesToTargetFiles() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Confirmation', 'Are you sure you want to copy checkboxes to all target files?', ui.ButtonSet.YES_NO);

  // Proceed only if the user clicks "Yes"
  if (response == ui.Button.YES) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var masterSheet = ss.getSheetByName("Material Input"); // Master file's "Material Input" tab

    // Define ranges for checkboxes
    var checkboxRanges = ['H3:H41', 'M3:M41', 'R3:R', 'W3:W']; // List of ranges with checkboxes
    // Get the URLs of target salesmen's sheets from the "Update Wizard" tab
    var wizardSheet = ss.getSheetByName('Update Wizard'); // Replace with the actual tab name
    var urlRange = wizardSheet.getRange('C2:C'); // Assuming URLs are in column B starting from row 2
    var urls = urlRange.getValues().filter(String); // Get all URLs and filter out any blanks

    // Loop through each target URL and copy checkboxes to the "Material Input" tab in each file
    urls.forEach(function(row) {
      var targetUrl = row[0];
      if (targetUrl && targetUrl !== "-") { // Skip if the URL is a dash ("-")
        try {
          var targetSpreadsheet = SpreadsheetApp.openByUrl(targetUrl);
          var targetSheet = targetSpreadsheet.getSheetByName("Material Input"); // Ensure "Material Input" exists in target

          if (targetSheet) {
            // Loop through each checkbox range
            checkboxRanges.forEach(function(rangeStr) {
              var masterRange = masterSheet.getRange(rangeStr);
              var targetRange = targetSheet.getRange(rangeStr);
              var masterValues = masterRange.getValues();
              var masterValidations = masterRange.getDataValidations();

              // Copy data validation for checkboxes while ignoring cells containing "~"
              for (var i = 0; i < masterValues.length; i++) {
                for (var j = 0; j < masterValues[i].length; j++) {
                  if (masterValues[i][j] !== "~") {
                    targetRange.getCell(i + 1, j + 1).setDataValidation(masterValidations[i][j]);
                  }
                }
              }
            });
          } else {
            Logger.log("No 'Material Input' tab found in " + targetUrl);
          }
        } catch (e) {
          Logger.log("Error accessing file: " + targetUrl + ". " + e.message);
        }
      }
    });

    // Show confirmation message after all URLs have been processed
    ui.alert('Checkboxes have been successfully copied to all target files.');
  } else {
    ui.alert('Operation canceled. No checkboxes were copied.');
  }
}
