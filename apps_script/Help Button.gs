function showFAQModal() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('FAQs');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('FAQs sheet not found.');
    return;
  }
  
  const questions = sheet.getRange('A2:A' + sheet.getLastRow()).getValues().flat();
  const answers = sheet.getRange('B2:B' + sheet.getLastRow()).getValues().flat();

  const template = HtmlService.createTemplateFromFile('faq_modal');
  template.questions = questions;
  template.answers = answers;
  
  const htmlOutput = template.evaluate().setWidth(700).setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'FAQ Viewer');
}

function getAnswer(question) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('FAQs');
  if (!sheet) {
    return "FAQs sheet not found.";
  }
  
  const questions = sheet.getRange('A2:A' + sheet.getLastRow()).getValues().flat();
  const answers = sheet.getRange('B2:B' + sheet.getLastRow()).getValues().flat();
  
  const index = questions.indexOf(question);
  
  if (index === -1) {
    return "Answer not found. Please try again.";
  }
  
  return answers[index];
}
