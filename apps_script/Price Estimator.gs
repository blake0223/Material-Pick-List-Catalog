
/**
 * Full price run: inventory matches + GPT estimates (password protected).
 */
function runInventoryCheck() {
  const ui = SpreadsheetApp.getUi();
  const pass = ui.prompt(
    'Password Required',
    'Enter password to run price estimate:',
    ui.ButtonSet.OK_CANCEL
  );
  if (pass.getSelectedButton() !== ui.Button.OK || pass.getResponseText() !== 'Shibuya') {
    ui.alert('Incorrect password—access denied.');
    return;
  }

  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const sheet   = ss.getSheetByName('Pricing');
  const guts    = ss.getSheetByName('Pricing Guts');
  const gutsData = guts.getRange('A2:B' + guts.getLastRow()).getValues();
  const items    = sheet.getRange('A2:A' + sheet.getLastRow()).getValues();

  // clear previous results
  sheet.getRange('B2:C' + sheet.getLastRow()).clearContent();
  Logger.clear();

  const examples = [];

  for (let i = 0; i < items.length; i++) {
    const part     = items[i][0];
    if (!part) break;
    const row      = i + 2;
    const normPart = String(part).trim();

    // Ignore placeholder
    if (normPart.toUpperCase() === 'NAME AND MODEL NUMBER OR DIMENSIONS') {
      sheet.getRange(row, 2).setValue(0);
      sheet.getRange(row, 3).setValue('Ignored');
      Logger.log(`Row ${row}: placeholder ignored, set to 0`);
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `${part}: set to 0 (Ignored)`,
        'Price Lookup',
        3
      );
      continue;
    }

    const lowerPart = normPart.toLowerCase();

    // 1) Inventory fuzzy‑match
    let bestDist  = Infinity;
    let bestPrice = null;
    let bestRow   = null;
    for (let j = 0; j < gutsData.length; j++) {
      const [gName, gPrice] = gutsData[j];
      if (!gName) continue;
      const normG = String(gName).trim().toLowerCase();
      const dist  = levenshtein(lowerPart, normG);
      if (dist < bestDist) {
        bestDist  = dist;
        bestPrice = gPrice;
        bestRow   = j + 2;
      }
    }

    if (bestDist <= 3) {
      // Write inventory match
      sheet.getRange(row, 2).setValue(bestPrice);
      sheet.getRange(row, 3).setValue(`Pricing Guts!A${bestRow}`);
      Logger.log(
        `Row ${row}: "${part}" → Inventory match A${bestRow} ` +
        `(dist=${bestDist}, price=${bestPrice})`
      );
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `${part}: $${bestPrice} (Inventory)`,
        'Price Lookup',
        3
      );
      // Collect example
      if (examples.length < 5) {
        examples.push({ name: part, price: Number(bestPrice).toFixed(2) });
      }
    } else {
      // 2) GPT estimate
      const examplesText = examples.map(e => `${e.name} → ${e.price}`).join('\n');
      const estimate     = estimatePrice(part, examplesText);
      sheet.getRange(row, 2).setValue(estimate);
      sheet.getRange(row, 3).setValue('Estimated');
      Logger.log(`Row ${row}: "${part}" → GPT estimate $${estimate}`);
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `${part}: $${estimate} (Estimated)`,
        'Price Estimate',
        3
      );
      // Add to examples if valid
      if (examples.length < 5 && !isNaN(parseFloat(estimate))) {
        examples.push({ name: part, price: Number(estimate).toFixed(2) });
      }
    }
  }

  ui.alert('Run Price Estimate complete. See View→Logs for details.');
}

/**
 * Inventory‑only run: updates pricing for inventory matches,
 * leaves other rows untouched.
 */
function runInventoryOnly() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const sheet   = ss.getSheetByName('Pricing');
  const guts    = ss.getSheetByName('Pricing Guts');
  const gutsData = guts.getRange('A2:B' + guts.getLastRow()).getValues();
  const items    = sheet.getRange('A2:A' + sheet.getLastRow()).getValues();

  Logger.clear();

  for (let i = 0; i < items.length; i++) {
    const part     = items[i][0];
    if (!part) break;
    const row      = i + 2;
    const normPart = String(part).trim();

    // Ignore placeholder
    if (normPart.toUpperCase() === 'NAME AND MODEL NUMBER OR DIMENSIONS') {
      sheet.getRange(row, 2).setValue(0);
      sheet.getRange(row, 3).setValue('Ignored');
      Logger.log(`Row ${row}: placeholder ignored, set to 0`);
      continue;
    }

    const lowerPart = normPart.toLowerCase();

    // Inventory fuzzy‑match
    let bestDist  = Infinity;
    let bestPrice = null;
    let bestRow   = null;
    for (let j = 0; j < gutsData.length; j++) {
      const [gName, gPrice] = gutsData[j];
      if (!gName) continue;
      const normG = String(gName).trim().toLowerCase();
      const dist  = levenshtein(lowerPart, normG);
      if (dist < bestDist) {
        bestDist  = dist;
        bestPrice = gPrice;
        bestRow   = j + 2;
      }
    }

    if (bestDist <= 3) {
      sheet.getRange(row, 2).setValue(bestPrice);
      sheet.getRange(row, 3).setValue(`Pricing Guts!A${bestRow}`);
      Logger.log(
        `Row ${row}: "${part}" → Inventory match A${bestRow} ` +
        `(dist=${bestDist}, price=${bestPrice})`
      );
    }
  }

  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Recheck Inventory complete.',
    'Pricing Tools',
    3
  );
}

/**
 * Runs a price breakdown for the current material input.
 * Reads names & quantities from "Material Input" (cols P/Q and U/V),
 * looks up unit prices in "Pricing" (A/B), and shows the results in an HTML dialog.
 */
function runPriceBreakdown() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const input   = ss.getSheetByName('Material Input');
  const pricing = ss.getSheetByName('Pricing');

  // Build item→unit price map
  const prData = pricing.getRange('A2:B' + pricing.getLastRow()).getValues();
  const priceMap = {};
  prData.forEach(r => {
    const name = String(r[0]).trim();
    const price = parseFloat(r[1]) || 0;
    if (name) priceMap[name] = price;
  });

  // Collect lines
  const lines = [];
  function collect(nameCol, qtyCol) {
    const names = input.getRange(nameCol + '2:' + nameCol + input.getLastRow()).getValues();
    const qtys  = input.getRange(qtyCol  + '2:' + qtyCol  + input.getLastRow()).getValues();
    for (let i = 0; i < names.length; i++) {
      const item = names[i][0];
      const qty  = parseFloat(qtys[i][0]) || 0;
      if (!item || qty <= 0) continue;
      const unit  = priceMap[item] || 0;
      lines.push({ name: item, unit: unit, qty: qty, total: unit * qty });
    }
  }
  collect('P','Q');
  collect('U','V');

  // Build HTML
  let html = '<div style="font-family:sans-serif;">'
           + '<h3>Price Breakdown</h3>'
           + '<table border="1" cellpadding="4" cellspacing="0">'
           + '<tr style="background:#eee;"><th>Item</th><th>Unit Price</th><th>Quantity</th><th>Total</th></tr>';
  let grandTotal = 0;
  lines.forEach(l => {
    html += `<tr>
      <td>${l.name}</td>
      <td style="text-align:right;">\$${l.unit.toFixed(2)}</td>
      <td style="text-align:right;">${l.qty}</td>
      <td style="text-align:right;">\$${l.total.toFixed(2)}</td>
    </tr>`;
    grandTotal += l.total;
  });
  html += `<tr style="font-weight:bold;">
      <td colspan="3" style="text-align:right;">Grand Total</td>
      <td style="text-align:right;">\$${grandTotal.toFixed(2)}</td>
    </tr></table></div>`;

  SpreadsheetApp.getUi()
    .showModalDialog(HtmlService.createHtmlOutput(html)
      .setWidth(600).setHeight(400),
      'Price Breakdown');
}

/**
 * Levenshtein edit distance.
 */
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

/**
 * Calls OpenAI API (gpt-3.5-turbo) to estimate a price.
 */
function estimatePrice(partName, examplesText) {
  const key = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if (!key) {
    Logger.log('Missing OPENAI_API_KEY');
    return 'Err';
  }

  const systemPrompt = `
You are an expert pricing engine for HVAC & plumbing parts.
Use recent prices from SupplyHouse, Grainger, and other common vendors.
Respond with exactly one numeric wholesale USD price, no symbols, no commentary.
`.trim();

  let userPrompt = '';
  if (examplesText) {
    userPrompt += `Examples:\n${examplesText}\n\n`;
  }
  userPrompt += `Estimate wholesale USD price for: ${partName}`;

  const payload = {
    model:       'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt }
    ],
    temperature: 0,
    max_tokens: 10
  };

  try {
    const res = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method:           'post',
      contentType:      'application/json',
      headers:          { Authorization: 'Bearer ' + key },
      payload:          JSON.stringify(payload),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) {
      Logger.log('Estimate HTTP ' + res.getResponseCode() + ': ' + res.getContentText());
      return 'Err';
    }
    const text = JSON.parse(res.getContentText())
      .choices[0].message.content.trim();
    Logger.log('GPT raw reply: ' + text);
    const m = text.match(/[\d,]+(?:\.\d+)?/);
    return m ? m[0].replace(/,/g, '') : 'Err';
  } catch (e) {
    Logger.log('Estimate error: ' + e);
    return 'Err';
  }
}
