function onEdit(e) {
  const changeOutSheetName = "Change Out Kits";
  const materialInputSheetName = "Material Input";
  const targetColumn = 3; // Column C in Change Out Kits

  const sheet = e.range.getSheet();

  // Clear other merged cell in Material Input
  if (sheet.getName() === materialInputSheetName) {
    const range1 = sheet.getRange('C26'); // First merged cell
    const range2 = sheet.getRange('C28'); // Second merged cell

    if (e.range.getRow() === 26 || e.range.getRow() === 27) {
      range2.clearContent();
    } else if (e.range.getRow() === 28 || e.range.getRow() === 29) {
      range1.clearContent();
    }

    const modelRange = sheet.getRange('F3:F41');
    const dimensionRange = sheet.getRange('K3:K41');
    const nameModelDimensionRange = sheet.getRange('P44:P87');

    modelRange.getValues().forEach(function(row, rowIndex) {
      if (row[0] === "") {
        modelRange.getCell(rowIndex + 1, 1).setValue("ENTER MODEL NUMBER HERE");
      }
    });

    dimensionRange.getValues().forEach(function(row, rowIndex) {
      if (row[0] === "") {
        dimensionRange.getCell(rowIndex + 1, 1).setValue("ENTER DIMENSIONS HERE");
      }
    });

    nameModelDimensionRange.getValues().forEach(function(row, rowIndex) {
      if (row[0] === "") {
        nameModelDimensionRange.getCell(rowIndex + 1, 1).setValue("NAME AND MODEL NUMBER OR DIMENSIONS");
      }
    });

    // Define ranges for alternating colors
    const rangesToFormat = [
      sheet.getRange('E3:H41'),
      sheet.getRange('J3:M41'),
      sheet.getRange('O3:R'),
      sheet.getRange('T3:W')
    ];

    rangesToFormat.forEach(function(range) {
      const values = range.getValues();
      for (let row = 0; row < values.length; row++) {
        const backgroundColor = (row % 2 === 0) ? "#ffffff" : "#f0f0f0";
        for (let col = 0; col < values[row].length; col++) {
          if (values[row][col] !== "~") {
            const cell = range.getCell(row + 1, col + 1);
            cell.setBackground(backgroundColor);
            cell.setFontColor("#000000");
            cell.setFontFamily("Times New Roman");
            cell.setFontSize(11);
            cell.setFontStyle("normal");
            cell.setBorder(false, false, false, false, false, false);
            cell.setHorizontalAlignment("center");
          }
        }
      }
    });
  }

  // Change Out Kits specific functionality
  if (sheet.getName() === changeOutSheetName && e.range.columnStart === targetColumn) {
    const row = e.range.rowStart;
    const kitName = sheet.getRange(row, 2).getValue(); // Adjacent Kit Name in Column B
    const size = sheet.getRange(14, 2).getValue(); // Size in B14

    const kitListSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Kit Lists");
    const kitListData = kitListSheet.getRange("B2:E" + kitListSheet.getLastRow()).getValues();

    // Retrieve materials matching kit name and size
    const materials = kitListData
      .filter(row => row[0] === kitName && row[1] === size)
      .map(row => ({ name: row[2], quantity: row[3] }));

    if (materials.length === 0) {
      SpreadsheetApp.getUi().alert(`No materials found for the kit name: ${kitName} and size: ${size}`);
      sheet.getRange(row, targetColumn).setValue("FALSE");
      return;
    }

    let message = `Materials for ${kitName} (${size}) (per kit):\n\n`;
    materials.forEach(material => {
      message += `${material.name} - x${material.quantity}\n`;
    });
    message += `\nSee above for materials included in a single kit. Please enter below how many systems of this category and size you want (numbers only):`;

    const ui = SpreadsheetApp.getUi();
    const response = ui.prompt(message, ui.ButtonSet.OK_CANCEL);

    if (response.getSelectedButton() === ui.Button.OK) {
      const userInput = parseInt(response.getResponseText(), 10);
      if (isNaN(userInput) || userInput <= 0) {
        ui.alert("Invalid number entered. Please try again.");
        sheet.getRange(row, targetColumn).setValue("FALSE");
        return;
      }

      const outputStartRow = 4;
      const outputMaterialCol = 6; // Column F
      const outputQuantityCol = 5; // Column E

      // Get existing output data and map it
      const existingOutputData = sheet.getRange(outputStartRow, outputMaterialCol, sheet.getLastRow() - outputStartRow + 1, 2).getValues();
      const existingMap = new Map();

      existingOutputData.forEach(([name, quantity]) => {
        if (name) {
          existingMap.set(name, quantity || 0);
        }
      });

      // Process materials one by one
      materials.forEach(material => {
        const materialName = material.name;
        const materialQuantity = material.quantity * userInput;

        if (materialQuantity > 0) {
          if (existingMap.has(materialName)) {
            existingMap.set(materialName, existingMap.get(materialName) + materialQuantity);
          } else {
            existingMap.set(materialName, materialQuantity);
          }
        }
      });

      // Find the first blank row for new entries
      let blankRow = outputStartRow;
      while (sheet.getRange(blankRow, outputMaterialCol).getValue()) {
        blankRow++;
      }

      // Write the updated data back to the sheet
      existingMap.forEach((quantity, name) => {
        if (quantity > 0) {
          const existingRow = [...Array(blankRow - outputStartRow)].findIndex((_, idx) => 
            sheet.getRange(outputStartRow + idx, outputMaterialCol).getValue() === name);

          if (existingRow !== -1) {
            const rowToUpdate = outputStartRow + existingRow;
            const currentQuantity = sheet.getRange(rowToUpdate, outputQuantityCol).getValue();
            sheet.getRange(rowToUpdate, outputQuantityCol).setValue(currentQuantity + quantity);
          } else {
            sheet.getRange(blankRow, outputMaterialCol).setValue(name);
            sheet.getRange(blankRow, outputQuantityCol).setValue(quantity);
            blankRow++;
          }
        }
      });

      ui.alert("Kit Materials added to pending selection");
    }

    sheet.getRange(row, targetColumn).setValue("FALSE");
  }
}