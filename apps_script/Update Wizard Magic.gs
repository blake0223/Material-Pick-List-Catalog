function applyFinalFormatting() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Confirmation', 'Launch update?', ui.ButtonSet.YES_NO);

  if (response == ui.Button.NO) {
    return; // Stop if the user says no
  }

  // Open the master sheet
  var masterSheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1kgGvJRr5fTTG31LzxuGIvOSeuXWoHudVko-VYJCHpWI/edit');
  var materialInputSource = masterSheet.getSheetByName("Material Input");

  // Retrieve the salesmen details from the "Update Wizard" tab in the master sheet
  var wizardSheet = masterSheet.getSheetByName("Update Wizard");
  var salesmenData = wizardSheet.getRange("A2:C").getValues(); // Assuming data starts at row 2, columns A (names) and C (URLs)

  // Store the GAS_project_key for each salesman's file
  var projectKeys = {
    "John Irwin": "1biqDqPGsVCD4d7C7eLRAfBOlPrTvofGz6mBYn-rid_0TEpJlCWy5tmwY",
    "Giovanni Loaiza": "1IsHRW6yGM2hEydY3XN0pqoFbpwYe1WxMQkh4mQZPiVuZ44H8mpLSxcPQ",
    "Keith Bell": "1S0L67NEEXXCBYynT3hqgg4tPuLqHWH4hMkIphqQOGE29kPy71k-qon0f",
    "Umair Ahmed": "1bIY_axGmbjnOUjLbZ-eCtdbIFSkLjlilhLgiQIxZQ5apJTv5LCtXDrN4",
    "Pack-Timco Master File": "18e0WqKPcU4UYEa6xfkMT-yVt3X6ulJkBMo4hl1C8swEJm3PoqH5by_R2",
    "Jerry Petrini": "1_Kr6SrqmQ0pKWYvMa7sT1Gx6pDtwWeG6T3wUFsOK0FySVICBCtiaesRt",
    "Glenn Pack": "100bQrfGctUHEnLg_CsPildEYz8KWKgk1LzqUzdjmOnccIaBHP9yJNhUh",
    "Frank Bedini": "1A2V8XPtjQz4BaWyGFbQLDYtk6jmfLP7g0xcKoT8EY72L2KuZ9opt7l88",
    "John Troiano": "1JKAa0iAtrSNCKCP6bwIl0XTf11yZjYwiwqVVSG1rvgbC5RDZmWu_RH0w",
    "Chris McPhillips": "1xcwRAzwtOvnax9Y7Jl8kVjbQI5xolCnJe6YfeK-oYnuihjnWk_PHoRb4",
    "Kim Christensen" : "1acEPbBceV7_UPTQC0Aqe4RsxWntnYaBS2_qK4kSveAbQWiuRiw2yOGI1",
    "Patrick O'Gara" : "1XBMGQoQYMyzYSz2V1d5cdZ_5X2NEIF0SBEfx9wVvw0YrOJJhv54OtVSM"
  };

  // Loop through each salesman's file
  salesmenData.forEach(function(row, index) {
    var name = row[0].trim(); // Salesman's name from column A, trimmed to avoid extra spaces
    var fileUrl = row[2]; // File URL of the salesman's sheet from column C

    // Check if the name exists in projectKeys
    if (name && fileUrl && projectKeys[name]) {
      try {
        Logger.log("Processing " + name + " with file URL: " + fileUrl);
        var targetScriptId = projectKeys[name];

        if (targetScriptId === undefined) {
          throw new Error("targetScriptId is undefined for " + name);
        }

        // Open the target spreadsheet
        var targetSs = SpreadsheetApp.openByUrl(fileUrl);
        var materialInputTarget = targetSs.getSheetByName("Material Input");

        if (materialInputTarget) {
          var lastRow = materialInputSource.getLastRow(); // Get the last row from the source
          var lastColumn = materialInputSource.getLastColumn(); // Get the last column from the source

          // Step 1: Clear all formatting and conditional formatting in the target sheet
          var targetRange = materialInputTarget.getRange(1, 1, lastRow, lastColumn);
          targetRange.clearFormat(); // Clear existing formatting
          materialInputTarget.clearConditionalFormatRules(); // Clear conditional formatting

          // Step 2: Copy data from the source sheet to the target sheet
          var sourceValues = materialInputSource.getRange(1, 1, lastRow, lastColumn).getValues();
          materialInputTarget.getRange(1, 1, lastRow, lastColumn).setValues(sourceValues); // Copy data

          // Step 3: Match column widths between source and target sheets
          matchColumnWidths(materialInputSource, materialInputTarget, lastColumn);

          // Step 4: Apply alternating row colors to the entire sheet
          applyAlternatingColors(materialInputTarget, lastRow, lastColumn);

          // Step 5: Copy only conditional formatting and text formatting (no background colors) from the source to the target sheet
          copyTextAndConditionalFormatting(materialInputSource, materialInputTarget);

          // Step 6: Update Apps Script for the target project using method from StackOverflow reference
          updateScriptFromMaster('15xtW4kN75V5jzdrrBIbX5pIWImwuQsisLUq_VjOyrQmcxE3j_qLCkYYN', targetScriptId);

          //Step 7: Merge Cells
          applySpecificMerges(materialInputTarget);

          // Step 8: Manually set formulas in C8 and C9
          materialInputTarget.getRange("C8").setFormula("=TODAY()");
          materialInputTarget.getRange("C9").setFormula('=IFERROR(IF(VLOOKUP(C5, \'Scheduled Jobs\'!A:E, 5, FALSE) <> "", VLOOKUP(C5, \'Scheduled Jobs\'!A:E, 5, FALSE), "Not Scheduled"), "Not Scheduled")');
          materialInputTarget.getRange("B12").setFormula('=SUMPRODUCT(IFERROR(VLOOKUP(P2:P, Pricing!A:B, 2, FALSE), 0),Q2:Q)+SUMPRODUCT(IFERROR(VLOOKUP(U2:U, Pricing!A:B, 2, FALSE), 0),V2:V)');
          Logger.log("Successfully applied formatting, data, and script update for " + name);
        }
      } catch (e) {
        Logger.log("Error processing " + name + ": " + e.message);
      }
    } else {
      Logger.log("Error: Missing GAS_project_key for '" + name + "' or file URL is missing.");
    }
  });

  // Set the most recent run date in F3 of the "Update Wizard" tab
  wizardSheet.getRange("F3").setValue(new Date());

  SpreadsheetApp.getUi().alert('Formatting, data, and script updates applied to all target sheets successfully.');
}

// Helper function to match column widths
function matchColumnWidths(sourceSheet, targetSheet, lastColumn) {
  for (var col = 1; col <= lastColumn; col++) {
    var sourceWidth = sourceSheet.getColumnWidth(col);
    targetSheet.setColumnWidth(col, sourceWidth);
  }
}

// Helper function to update selected Apps Script content from the master project using StackOverflow example
function updateScriptFromMaster(masterProjectId, targetScriptId) {
  try {
    var url = 'https://script.googleapis.com/v1/projects/' + masterProjectId + '/content';
    var options = {
      'method': 'GET',
      'headers': {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
      },
      'muteHttpExceptions': true
    };

    var response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) {
      throw new Error('Failed to get master script content. Response: ' + response.getContentText());
    }

    var content = JSON.parse(response.getContentText());
    var updateUrl = 'https://script.googleapis.com/v1/projects/' + targetScriptId + '/content';
    var updateOptions = {
      'method': 'PUT',
      'contentType': 'application/json',
      'headers': {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
      },
      'payload': JSON.stringify(content),
      'muteHttpExceptions': true
    };

    var updateResponse = UrlFetchApp.fetch(updateUrl, updateOptions);
    if (updateResponse.getResponseCode() !== 200) {
      throw new Error('Failed to update target script. Response: ' + updateResponse.getContentText());
    }
    Logger.log('Successfully updated Apps Script for project ID: ' + targetScriptId);
  } catch (e) {
    Logger.log('Error in updateScriptFromMaster: ' + e.message);
  }
}

// Helper function to apply alternating row colors (white and light gray)
function applyAlternatingColors(sheet, lastRow, lastColumn) {
  var range = sheet.getRange(1, 1, lastRow, lastColumn);
  var backgrounds = range.getBackgrounds();
  var rowColors = ['#ffffff', '#f2f2f2']; // Alternating white and light gray

  for (var i = 0; i < backgrounds.length; i++) {
    var bgColor = rowColors[i % 2]; // Alternate colors for each row
    for (var j = 0; j < backgrounds[i].length; j++) {
      backgrounds[i][j] = bgColor; // Apply alternating colors
    }
  }
  range.setBackgrounds(backgrounds); // Set the background colors
}

// Helper function to copy only conditional formatting and text formatting from the source to the target
function copyTextAndConditionalFormatting(sourceSheet, targetSheet) {
  var sourceRange = sourceSheet.getDataRange(); // Get all the data range from the source sheet
  var targetRange = targetSheet.getRange(1, 1, sourceRange.getNumRows(), sourceRange.getNumColumns());

  // Copy text formatting only
  targetRange.setFontFamilies(sourceRange.getFontFamilies());
  targetRange.setFontSizes(sourceRange.getFontSizes());
  targetRange.setFontColors(sourceRange.getFontColors());
  targetRange.setFontWeights(sourceRange.getFontWeights());
  targetRange.setFontStyles(sourceRange.getFontStyles());

  // Copy horizontal and vertical alignment
  targetRange.setHorizontalAlignments(sourceRange.getHorizontalAlignments());
  targetRange.setVerticalAlignments(sourceRange.getVerticalAlignments());

  // Copy conditional formatting
  var sourceRules = sourceSheet.getConditionalFormatRules();
  var newRules = [];

  for (var i = 0; i < sourceRules.length; i++) {
    var rule = sourceRules[i];
    var newRule = rule.copy().setRanges([targetRange]).build(); // Apply to the entire target range
    newRules.push(newRule);
  }

  targetSheet.setConditionalFormatRules(newRules); // Set conditional formatting in the target sheet
}

function applySpecificMerges(sheet) {
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).breakApart();

  sheet.getRange("B2:C2").merge();
  sheet.getRange("B24:C25").merge();
  sheet.getRange("B26:B27").merge();
  sheet.getRange("B28:B29").merge();
  sheet.getRange("B30:B31").merge();
  sheet.getRange("B32:B33").merge();
  sheet.getRange("C26:C27").merge();
  sheet.getRange("C28:C29").merge();
  sheet.getRange("C30:C31").merge();
  sheet.getRange("C32:C33").merge();
}
