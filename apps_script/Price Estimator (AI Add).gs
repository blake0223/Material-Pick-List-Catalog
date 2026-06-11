function runInventoryPriceCheckForTargets() {
  const ui = SpreadsheetApp.getUi();
  const pass = ui.prompt(
    'Password Required',
    'Enter password to run price check:',
    ui.ButtonSet.OK_CANCEL
  );
  if (pass.getSelectedButton() !== ui.Button.OK || pass.getResponseText() !== 'Shibuya') {
    ui.alert('Incorrect password—access denied.');
    return;
  }

  const masterSS = SpreadsheetApp.getActiveSpreadsheet();
  const wizardSheet = masterSS.getSheetByName("Update Wizard");
  const urls = wizardSheet.getRange("C2:C").getValues().flat().filter(url => url);

  urls.forEach(url => {
    const targetSS = SpreadsheetApp.openByUrl(url);
    const pricingSheet = targetSS.getSheetByName('Pricing');
    const gutsSheet = targetSS.getSheetByName('Pricing Guts');

    if (pricingSheet && gutsSheet) {
      const gutsData = gutsSheet.getRange('A2:B' + gutsSheet.getLastRow()).getValues();
      const items = pricingSheet.getRange('A2:A' + pricingSheet.getLastRow()).getValues();

      for (let i = 0; i < items.length; i++) {
        const part = items[i][0];
        if (!part) continue;
        const row = i + 2;
        const lowerPart = String(part).trim().toLowerCase();

        let bestDist = Infinity;
        let bestPrice = null;
        for (let j = 0; j < gutsData.length; j++) {
          const [gName, gPrice] = gutsData[j];
          if (!gName) continue;
          const normG = String(gName).trim().toLowerCase();
          const dist = levenshtein(lowerPart, normG);
          if (dist < bestDist) {
            bestDist = dist;
            bestPrice = gPrice;
          }
        }

        if (bestDist <= 3 && bestPrice != null) {
          pricingSheet.getRange(row, 2).setValue(bestPrice);
          pricingSheet.getRange(row, 3).setValue('Pricing Guts');
        }
      }
    }
  });

  ui.alert('Inventory price check completed for all target files.');
}

function levenshtein(a, b) {
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 1; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      m[i][j] = Math.min(
        m[i - 1][j] + 1,
        m[i][j - 1] + 1,
        m[i - 1][j - 1] + cost
      );
    }
  }
  return m[b.length][a.length];
}
