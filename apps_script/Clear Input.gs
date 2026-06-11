function resetMaterialInput() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Confirmation', 'Are you sure you want to clear the template? This cannot be undone!', ui.ButtonSet.YES_NO);
  
  if (response == ui.Button.NO) {
    return; // Halt the function if user selects NO
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Material Input");

  // Clear the specified ranges in the "Material Input" tab unless the cell contains "~"
  clearCells(sheet, 'C4:C7');
  clearCells(sheet, 'G3:G');  // Adjust range based on new layout
  clearCells(sheet, 'L3:L');  // Adjust range based on new layout
  clearCells(sheet, 'Q3:Q');  // Adjust range based on new layout
  clearCells(sheet, 'V3:V');  // Adjust range based on new layout

  // Set F3:F41 to "ENTER MODEL NUMBER HERE"
  sheet.getRange('F3:F41').setValue('ENTER MODEL NUMBER HERE');

  // Set K3:K41 to "ENTER DIMENSIONS HERE"
  sheet.getRange('K3:K41').setValue('ENTER DIMENSIONS HERE');

  // Update P44:P87 to "NAME AND MODEL NUMBER OR DIMENSIONS"
  sheet.getRange('P44:P87').setValue('NAME AND MODEL NUMBER OR DIMENSIONS');
}

// Helper function to clear a range unless the cell contains "~"
function clearCells(sheet, rangeStr) {
  var range = sheet.getRange(rangeStr);
  var values = range.getValues();
  
  for (var i = 0; i < values.length; i++) {
    for (var j = 0; j < values[i].length; j++) {
      if (values[i][j] !== "~") {
        values[i][j] = "";
      }
    }
  }
  
  range.setValues(values);
}
