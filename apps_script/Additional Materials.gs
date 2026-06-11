function generateAdditionalMaterials() {
  // Prompt the user with a confirmation dialog box
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Check A1 of the "no touchy please" tab
  var noTouchySheet = ss.getSheetByName("no touchy please");
  if (noTouchySheet) {
    var a1Value = noTouchySheet.getRange("A1").getValue();
    var spreadsheetName = ss.getName();

    if (a1Value === spreadsheetName) {
      ui.alert(
        'Error',
        'Additional Material button is intended for existing material lists, please use the big red button.',
        ui.ButtonSet.OK
      );
      return; // Halt the function
    }
  }

  var response = ui.alert(
    'Generate Additional Materials',
    'Are you sure you would like to generate a list of additional materials and notify the warehouse?',
    ui.ButtonSet.YES_NO
  );

  // If user clicks "Yes"
  if (response == ui.Button.YES) {
    // Unhide the "Additional Material" tab
    var additionalMaterialSheet = ss.getSheetByName("Additional Material");
    if (additionalMaterialSheet) {
      additionalMaterialSheet.showSheet();
    } else {
      ui.alert("The 'Additional Material' sheet does not exist.");
      return;
    }

    // Get job name and person from Material Input tab
    var materialInputSheet = ss.getSheetByName("Material Input");
    if (!materialInputSheet) {
      ui.alert("The 'Material Input' sheet does not exist.");
      return;
    }

    var jobName = materialInputSheet.getRange("C4").getValue();
    var person = materialInputSheet.getRange("C3").getValue();

    // --- NEW: Equipment quantity check ---
    var modelNumbers = materialInputSheet.getRange('F3:F41').getValues().flat();
    for (var j = 0; j < modelNumbers.length; j++) {
      if (
        modelNumbers[j] !== 'ENTER MODEL NUMBER HERE' &&
        materialInputSheet.getRange('G' + (j + 3)).getValue() === ""
      ) {
        ui.alert(
          'Error',
          'Model Numbers have no quantities, enter quantities and try again.',
          ui.ButtonSet.OK
        );
        return;
      }
    }

    // --- NEW: Ductwork quantity check ---
    for (var k = 3; k <= 41; k++) {
      var dimension = materialInputSheet.getRange('K' + k).getValue();
      var quantity = materialInputSheet.getRange('L' + k).getValue();
      if (dimension !== 'ENTER DIMENSIONS HERE' && quantity === "") {
        ui.alert(
          'Error',
          'Plenums or special ductwork have no quantities, enter quantities and try again.',
          ui.ButtonSet.OK
        );
        return;
      }
    }

    // Get the active sheet's URL
    var url = ss.getUrl();

    // Send email notification
    var recipient = "blake@bellmech.com";
    var subject = "Additional Material Notification";
    var body =
      "Additional material was added for the " +
      jobName +
      " job by " +
      person +
      ".\n\nLink to sheet: " +
      url;

    MailApp.sendEmail(recipient, subject, body);

    // Inform the user that the email has been sent
    ui.alert("Email sent to Blake notifying additional material for the " + jobName + " job.");
  }
}
