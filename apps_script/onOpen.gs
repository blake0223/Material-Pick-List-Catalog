function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Tools')
    .addItem('Run Price Estimate', 'runInventoryCheck')
    .addItem('Recheck Inventory', 'runInventoryOnly')
    .addItem('Price Breakdown', 'runPriceBreakdown')
    .addItem('Equipment Validation','findFinancialSummaryEmail')
    .addSeparator()
    .addItem('Sync to GitHub', 'exportToGitHub')
    .addItem('✅ Clasp Test', 'claspConnectionTest')
    .addToUi();
}

/** Temporary deploy/clasp smoke test — remove after confirming. */
function claspConnectionTest() {
  SpreadsheetApp.getActiveSpreadsheet()
    .toast('clasp → GitHub → live sheet is working! 🎉', 'Clasp Test', 5);
}
