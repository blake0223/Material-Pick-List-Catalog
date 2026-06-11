function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Tools')
    .addItem('Run Price Estimate', 'runInventoryCheck')
    .addItem('Recheck Inventory', 'runInventoryOnly')
    .addItem('Price Breakdown', 'runPriceBreakdown')
    .addItem('Equipment Validation','findFinancialSummaryEmail')
    .addSeparator()
    .addItem('Sync to GitHub', 'exportToGitHub')
    .addToUi();
}
