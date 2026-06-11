function DraftList() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Material Input");

  // Check A1 of the "no touchy please" tab
  var noTouchySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("no touchy please");
  if (noTouchySheet) {
    var a1Value = noTouchySheet.getRange("A1").getValue();
    var spreadsheetName = SpreadsheetApp.getActiveSpreadsheet().getName();

    if (a1Value !== spreadsheetName) {
      ui.alert(
        'Error',
        'You may not create a new list using an existing one, this will wipe the current list entirely if allowed to continue.\n\nPlease go to your respective template for new list generation.',
        ui.ButtonSet.OK
      );
      return; // Halt the function
    }
  }

  // Check for salesman name in C3
  if (sheet.getRange('C3').getValue() === '-') {
    ui.alert('Error', 'Error, no salesman name listed. Enter name and try again.', ui.ButtonSet.OK);
    return; // Halt the function
  }

  // Check for empty fields in C4:C7 and list adjacent fields in B4:B7
  var emptyFields = [];
  var jobFields = sheet.getRange('C4:C7').getValues();
  var jobLabels = sheet.getRange('B4:B7').getValues();

  for (var i = 0; i < jobFields.length; i++) {
    if (jobFields[i][0] === "" || jobFields[i][0] === "~" || jobFields[i][0] === null) {
      emptyFields.push(jobLabels[i][0]);
    }
  }

  if (emptyFields.length > 0) {
    ui.alert('Error', 'The following job information fields are empty and need to be populated:\n' + emptyFields.join('\n'), ui.ButtonSet.OK);
    return; // Halt the function
  }

  // Check for "ENTER MODEL NUMBER HERE" in F3:F41
  var modelNumbers = sheet.getRange('F3:F41').getValues().flat();
  var allModelNumbersEmpty = modelNumbers.every(num => num === 'ENTER MODEL NUMBER HERE');

  if (allModelNumbersEmpty) {
    var proceedWithoutEquipment = ui.alert('Confirmation', 'This job has no equipment, are you sure you want to proceed?', ui.ButtonSet.YES_NO);
    if (proceedWithoutEquipment == ui.Button.NO) {
      return; // Halt the function
    }
  }

  // Check for missing quantities in F3:G41
  var modelQuantityIssues = false;
  for (var j = 0; j < modelNumbers.length; j++) {
    if (modelNumbers[j] !== 'ENTER MODEL NUMBER HERE' && sheet.getRange('G' + (j + 3)).getValue() === "") {
      modelQuantityIssues = true;
      break;
    }
  }

  if (modelQuantityIssues) {
    ui.alert('Error', 'Model Numbers have no quantities, enter quantities and try again.', ui.ButtonSet.OK);
    return; // Halt the function
  }

  // Check for missing quantities in K3:L41
  var ductworkIssues = false;
  for (var k = 3; k <=41; k++) {
    var dimension = sheet.getRange('K' + k).getValue();
    var quantity = sheet.getRange('L' + k).getValue();

    if (dimension !== 'ENTER DIMENSIONS HERE' && quantity === "") {
      ductworkIssues = true;
      break;
    }
  }

  if (ductworkIssues) {
    ui.alert('Error', 'Plenums or special ductwork have no quantities, enter quantities and try again.', ui.ButtonSet.OK);
    return; // Halt the function
  }

  // Proceed if at least one cell in Q3:Q or V3:V is NOT empty or "~"
  var materialsQ = sheet.getRange('Q3:Q').getValues().flat();
  var materialsV = sheet.getRange('V3:V').getValues().flat();

  var qHasValidMaterial = materialsQ.some(value => value !== "" && value !== "~" && value !== null);
  var vHasValidMaterial = materialsV.some(value => value !== "" && value !== "~" && value !== null);

  if (!qHasValidMaterial && !vHasValidMaterial) {
    var confirmMaterial = ui.alert(
      'Confirmation',
      'This material list only has Equipment and/or Specialized Ductwork.\nAre you certain this job needs nothing else?',
      ui.ButtonSet.YES_NO
    );
    if (confirmMaterial == ui.Button.NO) {
      return; // Halt the function
    }
  }

  // If all checks pass, continue with the original function
  var response = ui.alert('Confirmation', 'Are you sure you want to save this list as a draft for later?', ui.ButtonSet.YES_NO);

  if (response == ui.Button.YES) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = sheet.getRange('C4').getValue();

    // Create a copy of the entire spreadsheet
    var newName = 'Rough Draft List - ' + sheetName;
    var newSs = ss.copy(newName);

    // Check if the "Rough Draft Lists" folder exists, if not, create it
    var folderName = "Rough Draft Lists";
    var folder;
    var folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next(); // Get the folder if it exists
    } else {
      folder = DriveApp.createFolder(folderName); // Create the folder if it doesn't exist
    }

    // Move the new file to the folder
    DriveApp.getFileById(newSs.getId()).moveTo(folder);

    // Set A1 of the "no touchy please" tab in the new file to "ROUGH DRAFT"
    var newNoTouchySheet = newSs.getSheetByName("no touchy please");
    if (newNoTouchySheet) {
      newNoTouchySheet.getRange("A1").setValue("ROUGH DRAFT");
    }

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

    // Notify the user
    ui.alert('The rough draft list has been created as a new spreadsheet: ' + newName);
  }
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
