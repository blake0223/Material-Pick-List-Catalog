/***********************
* CORE FUNCTIONS
***********************/
var _cache = { lastFetch: 0, data: {} };
function getCachedRange(sheet, range) {
  var cacheKey = sheet.getName() + '|' + range;
  var now = Date.now();
  if (!_cache.data[cacheKey] || now - _cache.lastFetch > 300) {
    _cache.data[cacheKey] = sheet.getRange(range).getValues();
    _cache.lastFetch = now;
  }
  return _cache.data[cacheKey];
}

function findMatchingCategories(category) {
  var sheet = SpreadsheetApp.getActive().getSheetByName('Material Input');
  var values = sheet.getRange("O44:O88").getValues();
  var matches = [];
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === category) {
      matches.push(i + 44);
    }
  }
  return matches;
}

function clearQuantities() {
  var sheet = SpreadsheetApp.getActive().getSheetByName('Material Input');
  var ranges = [
    { col: 12, itemCol: 11 },
    { col: 17, itemCol: 16 },
    { col: 22, itemCol: 21 }
  ];
  ranges.forEach(function(r) {
    var values = sheet.getRange(3, r.col, sheet.getLastRow() - 2, 1).getValues();
    var items = sheet.getRange(3, r.itemCol, sheet.getLastRow() - 2, 1).getValues();
    for (var i = 0; i < values.length; i++) {
      if (items[i][0] !== '~') { values[i][0] = ''; }
    }
    sheet.getRange(3, r.col, values.length, 1).setValues(values);
  });
  sheet.getRange('K3:K41').setValue('ENTER DIMENSIONS HERE');
  sheet.getRange('O44:O88').setValue('SPECIFIC MATERIALS');
  sheet.getRange('P44:P88').setValue('NAME AND MODEL NUMBER OR DIMENSIONS');
  sheet.getRange('Q44:Q88').clearContent();
}

/***********************
* SAVE FUNCTION
***********************/
function saveMaterialsToCustomList() {
  var ss = SpreadsheetApp.getActive();
  var inputSheet = ss.getSheetByName('Material Input');
  var storageSheet = ss.getSheetByName('Custom List Storage');
  var ui = SpreadsheetApp.getUi();
  var kitName = storageSheet.getRange('D2').getValue();
  if (!kitName) {
    var resp = ui.prompt('Save Kit', 'Enter kit name:', ui.ButtonSet.OK_CANCEL);
    if (resp.getSelectedButton() !== ui.Button.OK || !resp.getResponseText()) return;
    kitName = resp.getResponseText().trim();
  }
  var finalData = [];
  var ductCat = inputSheet.getRange('J3:J41').getValues();
  var ductName = inputSheet.getRange('K3:K41').getValues();
  var ductQty = inputSheet.getRange('L3:L41').getValues();
  for (var i = 0; i < ductQty.length; i++) {
    var qty = ductQty[i][0], name = ductName[i][0], cat = ductCat[i][0];
    if (qty && name && name !== 'ENTER DIMENSIONS HERE') {
      finalData.push([kitName, cat + ' - ' + name, qty]);
    }
  }
  var lastRow = inputSheet.getLastRow();
  var equipData = inputSheet.getRange('P3:Q' + lastRow).getValues();
  for (var i = 0; i < equipData.length; i++) {
    var item = equipData[i][0], qty = equipData[i][1];
    if (item && qty && item !== '~' && item !== 'NAME AND MODEL NUMBER OR DIMENSIONS') {
      var absRow = i + 3;
      if (absRow >= 44 && absRow <= 88) {
        finalData.push([kitName, "SPECIFIC MATERIALS - " + item, qty]);
      } else {
        finalData.push([kitName, item, qty]);
      }
    }
  }
  var stockData = inputSheet.getRange('U3:V' + lastRow).getValues();
  for (var i = 0; i < stockData.length; i++) {
    var item = stockData[i][0], qty = stockData[i][1];
    if (item && qty && item !== '~') {
      finalData.push([kitName, item, qty]);
    }
  }
  if (finalData.length === 0) {
    ui.alert('Error: No valid materials with quantities to save');
    return;
  }
  var storageData = storageSheet.getRange('A2:C' + storageSheet.getLastRow()).getValues();
  var filtered = storageData.filter(function(row) { return row[0] !== kitName; });
  var newData = filtered.concat(finalData);
  storageSheet.getRange(2, 1, newData.length, 3).setValues(newData);
  storageSheet.getRange('D2').clearContent();
  clearQuantities();
  ui.alert('Kit "' + kitName + '" saved successfully');
}

/***********************
* LOADER HELPERS
***********************/
function loadDuctworkAndSpecMat(kitData, inputSheet) {
  var specificIndex = 0;
  var ductIndex = 0;
  kitData.forEach(function(row) {
    var savedItem = row[1], qty = row[2];
    if (savedItem.indexOf("SPECIFIC MATERIALS - ") === 0) {
      var actualItem = savedItem.replace("SPECIFIC MATERIALS - ", "").trim();
      var itemCol = inputSheet.getRange("P44:P88").getValues();
      for (var i = specificIndex; i < itemCol.length; i++) {
        if (!itemCol[i][0] || itemCol[i][0] === 'NAME AND MODEL NUMBER OR DIMENSIONS') {
          var rowIndex = i + 44;
          inputSheet.getRange(rowIndex, 15).setValue("SPECIFIC MATERIALS");
          inputSheet.getRange(rowIndex, 16).setValue(actualItem);
          inputSheet.getRange(rowIndex, 17).setValue(qty);
          specificIndex = i + 1;
          break;
        }
      }
    } else if (savedItem.indexOf(' - ') > -1) {
      var parts = savedItem.split(' - ');
      var cat = parts[0], itemName = parts.slice(1).join(' - ');
      var ductCat = inputSheet.getRange('J3:J41').getValues();
      for (var i = ductIndex; i < ductCat.length; i++) {
        if (ductCat[i][0] === cat && inputSheet.getRange(i + 3, 11).getValue() === 'ENTER DIMENSIONS HERE') {
          inputSheet.getRange(i + 3, 11).setValue(itemName);
          inputSheet.getRange(i + 3, 12).setValue(qty);
          ductIndex = i + 1;
          break;
        }
      }
    }
  });
}

function loadEquipmentAndStockItems(kitData, inputSheet) {
  var lastRow = inputSheet.getLastRow();
  kitData.forEach(function(row) {
    var savedItem = row[1], qty = row[2];
    if (savedItem.indexOf("SPECIFIC MATERIALS - ") !== 0 && savedItem.indexOf(' - ') === -1) {
      var equipRange = inputSheet.getRange('P3:P' + lastRow).getValues().flat();
      var loaded = false;
      for (var i = 0; i < equipRange.length; i++) {
        if (equipRange[i] === savedItem) {
          inputSheet.getRange(i + 3, 17).setValue(qty);
          loaded = true;
          break;
        }
      }
      if (!loaded) {
        var stockRange = inputSheet.getRange('U3:U' + lastRow).getValues().flat();
        for (var i = 0; i < stockRange.length; i++) {
          if (stockRange[i] === savedItem) {
            inputSheet.getRange(i + 3, 22).setValue(qty);
            break;
          }
        }
      }
    }
  });
}

function loadMaterialsFromCustomList() {
  var ss = SpreadsheetApp.getActive();
  var inputSheet = ss.getSheetByName('Material Input');
  var storageSheet = ss.getSheetByName('Custom List Storage');
  var ui = SpreadsheetApp.getUi();
  var storageData = storageSheet.getRange('A2:C' + storageSheet.getLastRow()).getValues();
  var kitNames = [...new Set(storageData.map(function(row){ return row[0]; }).filter(Boolean))];
  if (kitNames.length === 0) { ui.alert('Error: No kits found'); return; }
  var resp = ui.prompt('Load Kit', 'Available: ' + kitNames.join(', ') + '\nEnter exact kit name:', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var kitName = resp.getResponseText().trim();
  if (!kitNames.includes(kitName)) { ui.alert('Error: Kit not found'); return; }
  var kitData = storageData.filter(function(row){ return row[0] === kitName; });
  clearQuantities();
  loadDuctworkAndSpecMat(kitData, inputSheet);
  loadEquipmentAndStockItems(kitData, inputSheet);
  ui.alert('Kit "' + kitName + '" loaded successfully');
}

/***********************
* MAIN MENU FUNCTION
***********************/
function manageKits() {
  var ss = SpreadsheetApp.getActive();
  var ui = SpreadsheetApp.getUi();
  var inputSheet = ss.getSheetByName('Material Input');
  var storageSheet = ss.getSheetByName('Custom List Storage');
  if (!inputSheet || !storageSheet) {
    ui.alert('Error: Required sheets missing');
    return;
  }
  var editingKit = storageSheet.getRange('D2').getValue();
  if (editingKit) {
    var saveResp = ui.alert('Save changes to "' + editingKit + '" first?', ui.ButtonSet.YES_NO_CANCEL);
    if (saveResp === ui.Button.YES) {
      saveMaterialsToCustomList();
      return;
    } else if (saveResp === ui.Button.CANCEL) {
      return;
    }
  }
  var resp = ui.prompt('Kit Manager', 'Choose: SAVE, LOAD, or EDIT', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var action = resp.getResponseText().toLowerCase();
  switch(action) {
    case 'save': saveMaterialsToCustomList(); break;
    case 'load': loadMaterialsFromCustomList(); break;
    case 'edit': editMaterialsFromCustomList(); break;
    default: ui.alert('Invalid choice');
  }
}

/***********************
* EDIT FUNCTION
***********************/
function editMaterialsFromCustomList() {
  var ss = SpreadsheetApp.getActive();
  var storageSheet = ss.getSheetByName('Custom List Storage');
  var inputSheet = ss.getSheetByName('Material Input');
  var ui = SpreadsheetApp.getUi();
  var storageData = storageSheet.getRange('A2:C' + storageSheet.getLastRow()).getValues();
  var kitNames = [...new Set(storageData.map(function(row){ return row[0]; }).filter(Boolean))];
  if (kitNames.length === 0) { ui.alert('Error: No kits available'); return; }
  var resp = ui.prompt('Edit Kit', 'Available: ' + kitNames.join(', ') + '\nEnter exact kit name:', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var kitName = resp.getResponseText().trim();
  if (!kitNames.includes(kitName)) { ui.alert('Error: Kit not found'); return; }
  storageSheet.getRange('D2').setValue(kitName);
  SpreadsheetApp.flush();
  var kitData = storageData.filter(function(row){ return row[0] === kitName; });
  var updatedData = storageData.filter(function(row){ return row[0] !== kitName; });
  storageSheet.getRange(2, 1, updatedData.length, 3).setValues(updatedData);
  clearQuantities();
  loadDuctworkAndSpecMat(kitData, inputSheet);
  loadEquipmentAndStockItems(kitData, inputSheet);
  ui.alert('Editing kit "' + kitName + '". Make changes and click SAVE when done.');
}
