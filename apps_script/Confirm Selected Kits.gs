function runMaterialUpdate() {
  const ui = SpreadsheetApp.getUi();
  const confirmation = ui.alert(
    "Confirm Selection?",
    "Do you want to add quantities to the material input tab?",
    ui.ButtonSet.YES_NO
  );

  if (confirmation !== ui.Button.YES) {
    ui.alert("Operation canceled.");
    return;
  }

  const changeOutSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Change Out Kits");
  const materialInputSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Material Input");

  if (!changeOutSheet || !materialInputSheet) {
    ui.alert("Required sheets not found.");
    return;
  }

  const materialNames = changeOutSheet.getRange("F4:F" + changeOutSheet.getLastRow()).getValues().flat();
  const materialQuantities = changeOutSheet.getRange("E4:E" + changeOutSheet.getLastRow()).getValues().flat();

  materialNames.forEach((material, index) => {
    if (material) {
      const quantity = materialQuantities[index] || 0;

      const materialInputDataP = materialInputSheet.getRange("P2:P" + materialInputSheet.getLastRow()).getValues().flat();
      const materialInputDataQ = materialInputSheet.getRange("Q2:Q" + materialInputSheet.getLastRow()).getValues().flat();
      const materialInputDataU = materialInputSheet.getRange("U2:U" + materialInputSheet.getLastRow()).getValues().flat();
      const materialInputDataV = materialInputSheet.getRange("V2:V" + materialInputSheet.getLastRow()).getValues().flat();

      const matchInP = materialInputDataP.indexOf(material);
      const matchInU = materialInputDataU.indexOf(material);

      if (matchInP !== -1) {
        const targetCell = materialInputSheet.getRange(matchInP + 2, 17); // Column Q
        const existingQuantity = targetCell.getValue() || 0;
        targetCell.setValue(existingQuantity + quantity);
      }

      if (matchInU !== -1) {
        const targetCell = materialInputSheet.getRange(matchInU + 2, 22); // Column V
        const existingQuantity = targetCell.getValue() || 0;
        targetCell.setValue(existingQuantity + quantity);
      }
    }
  });

  // Clear E4:F of the Change Out Kits tab
  changeOutSheet.getRange("E4:F" + changeOutSheet.getLastRow()).clearContent();

  ui.alert("Selected kit materials have been added to the Material List.");
}
