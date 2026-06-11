function checkMaterialInput() {
  const ui = SpreadsheetApp.getUi();
  
  // Prompt the user with a simple yes/no question
  const response = ui.alert('Wanna be nosy?', ui.ButtonSet.YES_NO);
  
  if (response == ui.Button.YES) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const updateWizardSheet = ss.getSheetByName('Update Wizard');
    
    const salesmen = updateWizardSheet.getRange('A2:A').getValues().filter(String);
    const urls = updateWizardSheet.getRange('C2:C').getValues().filter(String);
    
    let results = [];
    
    urls.forEach((url, index) => {
      if (url[0]) {
        const salesSpreadsheet = SpreadsheetApp.openByUrl(url[0]);
        const materialInputSheet = salesSpreadsheet.getSheetByName('Material Input');

        const checks = [
          materialInputSheet.getRange('F7:F41').getValues().flat().every(value => value === "ENTER MODEL NUMBER HERE"),
          materialInputSheet.getRange('K7:K30').getValues().flat().every(value => value === "ENTER DIMENSIONS HERE"),
          materialInputSheet.getRange('C4:C7').getValues().flat().every(value => value === ""),
          materialInputSheet.getRange('L3:L41').getValues().flat().every(value => value === ""),
          materialInputSheet.getRange('G3:G41').getValues().flat().every(value => value === ""),
          materialInputSheet.getRange('Q3:Q').getValues().flat().every(value => value === "" || value === "~"),
          materialInputSheet.getRange('V3:V').getValues().flat().every(value => value === "" || value === "~")
        ];

        const result = checks.every(Boolean) ? "Clear" : "In Use";
        results.push(`${salesmen[index][0]} - ${result}`);
        SpreadsheetApp.getActiveSpreadsheet().toast(`${salesmen[index][0]} - ${result}`, "Checking...", 2);
      }
    });
    
    const finalMessage = results.join('\n');
    ui.alert("Check Completed", finalMessage, ui.ButtonSet.OK);
  } else {
    ui.alert('Check canceled.');
  }
}
