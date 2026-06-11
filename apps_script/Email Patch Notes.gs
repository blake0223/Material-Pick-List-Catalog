function sendEmailsToSalesmen() {
  // Create a confirmation dialog
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Confirmation', 'Are you sure you want to send the emails?', ui.ButtonSet.YES_NO);

  // If the user clicks "No," stop the script
  if (response == ui.Button.NO) {
    return; // Exit the function
  }

  // If the user clicks "Yes," proceed to send the emails
  if (response == ui.Button.YES) {
    // Open the master sheet
    var masterSheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1kgGvJRr5fTTG31LzxuGIvOSeuXWoHudVko-VYJCHpWI/edit');
    
    // Get the "Update Wizard" sheet
    var wizardSheet = masterSheet.getSheetByName("Update Wizard");
    
    // Get the patch notes from the range E16:G (all rows with data starting from E16)
    var patchNotesRange = wizardSheet.getRange("E16:G" + wizardSheet.getLastRow()).getValues();
    
    // Format the patch notes by joining each row's content into a new line
    var patchNotes = patchNotesRange.map(row => row.join(" ")).join("\n");

    // Get the list of salesmen data (names, emails, URLs) from the "Update Wizard" sheet
    var salesmenData = wizardSheet.getRange("A2:C").getValues(); // Assuming names are in A, emails in B, URLs in C

    salesmenData.forEach(function(row) {
      var name = row[0]; // Salesman's name (Column A)
      var email = row[1]; // Salesman's email (Column B)
      var fileUrl = row[2]; // File URL of the salesman's sheet (Column C)

      if (email && email.includes('@')) {  // Check if email is valid
        var subject = "Material Tracker Updated";
        var body = "Hey " + name + ",\n\nThis is an automated message to inform you that your material list maker file has been updated.\n\nPatch Notes:\n" + patchNotes;
        
        // Send the email
        MailApp.sendEmail(email, subject, body);
        Logger.log("Email sent to: " + email);
      } else {
        Logger.log("Invalid or missing email for: " + name);
      }
    });
    
    // Clear the contents of E16:G after emails are sent
    wizardSheet.getRange("E16:G" + wizardSheet.getLastRow()).clearContent();
    
    // Show a success message
    SpreadsheetApp.getUi().alert('Emails sent to all valid salesmen and Patch Notes cleared.');
  }
}
