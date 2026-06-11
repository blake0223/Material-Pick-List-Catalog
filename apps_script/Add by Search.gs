function submitItem() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Material Input');
  if (!sheet) return;

  const partName = sheet.getRange('C30').getValue();
  const quantity = sheet.getRange('C32').getValue();

  if (!partName || !quantity || isNaN(quantity)) {
    SpreadsheetApp.getUi().alert('Invalid input. Please select a material or fitting and enter the quantity needed.');
    return;
  }

  // Confirmation before proceeding
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(`Submit x${quantity} ${partName}(s) to list?`, ui.ButtonSet.YES_NO);
  
  if (response !== ui.Button.YES) {
    ui.alert('Submission canceled.');
    return;
  }

  const nameRange1 = sheet.getRange('P3:P' + sheet.getLastRow());
  const quantityRange1 = sheet.getRange('Q3:Q' + sheet.getLastRow());
  const nameRange2 = sheet.getRange('U3:U' + sheet.getLastRow());
  const quantityRange2 = sheet.getRange('V3:V' + sheet.getLastRow());

  const names1 = nameRange1.getValues().flat();
  const names2 = nameRange2.getValues().flat();

  let matchFound = false;

  // Search in the first range
  for (let i = 0; i < names1.length; i++) {
    if (names1[i] === partName) {
      const existingQuantity = quantityRange1.getCell(i + 1, 1).getValue();
      quantityRange1.getCell(i + 1, 1).setValue(existingQuantity + quantity);
      matchFound = true;
      break;
    }
  }

  // Search in the second range if no match found in the first range
  if (!matchFound) {
    for (let i = 0; i < names2.length; i++) {
      if (names2[i] === partName) {
        const existingQuantity = quantityRange2.getCell(i + 1, 1).getValue();
        quantityRange2.getCell(i + 1, 1).setValue(existingQuantity + quantity);
        matchFound = true;
        break;
      }
    }
  }

  if (matchFound) {
    SpreadsheetApp.getUi().alert('Submission successful!');
    sheet.getRange('C26').setValue('');
    sheet.getRange('C32').clearContent();
    sheet.getRange('C28').setValue('');
  } else {
    SpreadsheetApp.getUi().alert('Material not found. Please check and try again.');
  }
}
