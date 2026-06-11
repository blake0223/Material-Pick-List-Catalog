// Global variables
var isFinalized = false;
var isResumeProcessCalled = false;
/**
 * Insert a single model string into the first (topmost) open slot in F3:F41
 * where the value is exactly "ENTER MODEL NUMBER HERE".
 * Never overwrites a non-placeholder.
 * @returns {boolean} true if inserted, false if no open slot
 */
function insertModelAtNextOpenSlot_(sheet, modelText) {
  var PLACEHOLDER = 'ENTER MODEL NUMBER HERE';
  var range = sheet.getRange('F3:F41');
  var values = range.getValues();

  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === PLACEHOLDER) {
      var row = i + 3; // because F3 is row 3
      sheet.getRange('F' + row).setValue(modelText);
      sheet.getRange('G' + row).setValue(1); // quantity = 1
      return true;
    }
  }
  return false; // no open slot
}

/**
 * Insert multiple items in order, each into the next open slot.
 * If any item cannot be inserted (no open slot), it is skipped and collected.
 * Returns an array of items that could NOT be inserted.
 */
function insertModels_(sheet, items) {
  var failed = [];
  for (var i = 0; i < items.length; i++) {
    var ok = insertModelAtNextOpenSlot_(sheet, items[i]);
    if (!ok) failed.push(items[i]);
  }
  return failed;
}

/**
 * NEW: Your simplified RDS decision tree that writes items into F3:F41.
 * It only asks the questions you specified and inserts the starred items.
 * No overwrites—only fills cells that equal "ENTER MODEL NUMBER HERE".
 */
function runRDSDecisionAndInsert_() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Material Input');

  // Q1 — Does this job have Lennox equipment?
  var q1 = ui.alert(
    'RDS Helper',
    'Does this job have Lennox equipment?',
    ui.ButtonSet.YES_NO
  );
  if (q1 === ui.Button.NO) {
    // No → continue past RDS questions (do nothing)
    return;
  }

  // Q2 — Is there a furnace with a factory installed RDS board? (Model number ends in K)
  var q2 = ui.alert(
    'Furnace RDS Board',
    'Is there a furnace with a factory installed RDS board? (Model number ends in K)',
    ui.ButtonSet.YES_NO
  );

  if (q2 === ui.Button.YES) {
    // YES → *RDS Coil Sensor Kit (26Z69)*
    var failedA = insertModels_(sheet, ['RDS Coil Sensor Kit (26Z69)']);
    // Only notify if something could NOT be inserted
    if (failedA.length) {
      ui.alert('No open model slots in F3:F41 for:\n• ' + failedA.join('\n• '));
    }
    return; // per flow, stop after this outcome
  }

  // Q3 — Does this system include a furnace?
  var q3 = ui.alert(
    'System Furnace',
    'Does this system include a furnace?',
    ui.ButtonSet.YES_NO
  );

  if (q3 === ui.Button.YES) {
    // YES → *RDS Communicating Board (27A03)* & *RDS Coil Sensor Kit (26Z69)*
    var failedB = insertModels_(sheet, [
      'RDS Communicating Board (27A03)',
      'RDS Coil Sensor Kit (26Z69)'
    ]);
    if (failedB.length) {
      ui.alert('No open model slots in F3:F41 for:\n• ' + failedB.join('\n• '));
    }
    return; // per flow, stop after this outcome
  }

  // Q4 — Is there a Lennox r454b air handler ?
  var q4 = ui.alert(
    'Lennox R454B AHU',
    'Is there a Lennox r454b air handler?',
    ui.ButtonSet.YES_NO
  );

  if (q4 === ui.Button.NO) {
    // NO → *RDS AHU Sensor Kit (27J27)* & *Non-Communicating Blower Control Board (27A02)*
    var failedC = insertModels_(sheet, [
      'RDS AHU Sensor Kit (27J27)',
      'Non-Communicating Blower Control Board (27A02)'
    ]);
    if (failedC.length) {
      ui.alert('No open model slots in F3:F41 for:\n• ' + failedC.join('\n• '));
    }
    return; // done
  }

  // If YES to Lennox r454b AHU → no parts to add; done.
  return;
}

// URL of your deployed Web App (execute-as-Blake)
const VALIDATION_URL =
  'https://script.google.com/macros/s/AKfycbwSjrpJxzvENuoeKeTsI59eFjgTVeLAf36CQ4MuvqNi47xs_HOtpcKQpjoicrqIf6pu/exec';
function findFinancialSummaryEmail() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const ui      = SpreadsheetApp.getUi();
  const sheet   = ss.getSheetByName('Material Input');

  // --- NEW: pack-timco bypass ---
  const jobType = sheet.getRange('C7').getDisplayValue().trim();
  if (jobType === 'Pack-Timco') {
    ss.toast('Bypassing financial validation for Pack-Timco');
    return true;
  }
  // --- end bypass ---

  const jobId = sheet.getRange('C4').getDisplayValue().trim();
  let result;

  // Attempt to call validation service—if it errors (e.g. missing URL_FETCH scope),
  // skip validation and proceed normally.
  try {
    const resp = UrlFetchApp.fetch(VALIDATION_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        spreadsheetId: ss.getId(),
        jobId: jobId
      }),
      muteHttpExceptions: true
    });
    result = JSON.parse(resp.getContentText());
  } catch (e) {
    ss.toast('Skipping financial summary validation (no fetch permission).');
    return true;
  }

  // If the service says "go ahead," we’re done
  if (result.proceed) {
    ss.toast('Models verified by financial summary');
    return true;
  }

  // Otherwise there are mismatches → two‐box confirmation flow:
  const message = result.message;
  const box1 = ui.alert('Validation Results', message, ui.ButtonSet.YES_NO);
  if (box1 === ui.Button.NO) {
    return false;
  }
  const box2 = ui.alert(
    'Are you sure and paying attention?\n\nIf so select NO',
    ui.ButtonSet.YES_NO
  );
  if (box2 === ui.Button.YES) {
    return false;
  }

  ss.toast('Models verified by financial summary');
  return true;
}

function REDBUTTON() {
  if (!findFinancialSummaryEmail()) return;

  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Material Input");
  
  runRDSDecisionAndInsert_(); // NEW: simplified flow that writes directly into F3:F41

  // --- Original validation & finalization logic follows ---
  var noTouchySheet = ss.getSheetByName("no touchy please");
  if (noTouchySheet) {
    var a1Value = noTouchySheet.getRange("A1").getValue();
    var spreadsheetName = ss.getName();
    if (a1Value !== spreadsheetName && a1Value !== "ROUGH DRAFT") {
      ui.alert(
        'Error',
        'You may not create a new list using an existing one, this will wipe the current list entirely if allowed to continue.\n\nPlease go to your respective template for new list generation.',
        ui.ButtonSet.OK
      );
      return;
    }
  }

  if (
    sheet.getRange('C3').getValue() === '-' ||
    (sheet.getRange('C3').getValue() === 'New Update!' &&
      noTouchySheet.getRange('A1').getValue() !== 'Material List - Bell Master File')
  ) {
    ui.alert(
      'Error',
      'Error, no salesman name listed. Enter name and try again.',
      ui.ButtonSet.OK
    );
    return;
  }

  var emptyFields = [];
  var jobFields = sheet.getRange('C4:C7').getValues();
  var jobLabels = sheet.getRange('B4:B7').getValues();
  for (var i = 0; i < jobFields.length; i++) {
    if (
      jobFields[i][0] === "" ||
      jobFields[i][0] === "~" ||
      jobFields[i][0] === null
    ) {
      emptyFields.push(jobLabels[i][0]);
    }
  }
  if (emptyFields.length > 0) {
    ui.alert(
      'Error',
      'The following job information fields are empty and need to be populated:\n' +
        emptyFields.join('\n'),
      ui.ButtonSet.OK
    );
    return;
  }

  var modelNumbers = sheet.getRange('F3:F41').getValues().flat();
  var allModelNumbersEmpty = modelNumbers.every(
    (num) => num === 'ENTER MODEL NUMBER HERE'
  );
  if (allModelNumbersEmpty) {
    var proceedWithoutEquipment = ui.alert(
      'Confirmation',
      'This job has no equipment, are you sure you want to proceed?',
      ui.ButtonSet.YES_NO
    );
    if (proceedWithoutEquipment == ui.Button.NO) return;
  }

  var modelQuantityIssues = false;
  for (var j = 0; j < modelNumbers.length; j++) {
    if (
      modelNumbers[j] !== 'ENTER MODEL NUMBER HERE' &&
      sheet.getRange('G' + (j + 3)).getValue() === ""
    ) {
      modelQuantityIssues = true;
      break;
    }
  }
  if (modelQuantityIssues) {
    ui.alert(
      'Error',
      'Model Numbers have no quantities, enter quantities and try again.',
      ui.ButtonSet.OK
    );
    return;
  }

  var ductworkIssues = false;
  for (var k = 3; k <= 41; k++) {
    var dimension = sheet.getRange('K' + k).getValue();
    var quantity = sheet.getRange('L' + k).getValue();
    if (dimension !== 'ENTER DIMENSIONS HERE' && quantity === "") {
      ductworkIssues = true;
      break;
    }
  }
  if (ductworkIssues) {
    ui.alert(
      'Error',
      'Plenums or special ductwork have no quantities, enter quantities and try again.',
      ui.ButtonSet.OK
    );
    return;
  }

  var materialsQ = sheet.getRange('Q3:Q').getValues().flat();
  var materialsV = sheet.getRange('V3:V').getValues().flat();
  var qHasValidMaterial = materialsQ.some(
    (value) => value !== "" && value !== "~" && value !== null
  );
  var vHasValidMaterial = materialsV.some(
    (value) => value !== "" && value !== "~" && value !== null
  );
  if (!qHasValidMaterial && !vHasValidMaterial) {
    var confirmMaterial = ui.alert(
      'Confirmation',
      'This material list only has Equipment and/or Specialized Ductwork.\nAre you certain this job needs nothing else?',
      ui.ButtonSet.YES_NO
    );
    if (confirmMaterial == ui.Button.NO) return;
  }
    // --- Thermostat presence check ---
  var oValues = sheet.getRange('O2:O').getValues();
  var qValues = sheet.getRange('Q2:Q').getValues();
  var thermostatQs = [];

  for (var i = 0; i < oValues.length; i++) {
    if (oValues[i][0] === "THERMOSTATS") {
      thermostatQs.push(qValues[i][0]);
    }
  }

  var allThermostatQsEmpty = thermostatQs.length > 0 && thermostatQs.every(function(value) {
    return value === "" || value === null;
  });

  // --- Thermostat presence check ---
  var oValues = sheet.getRange('O2:O').getValues();
  var qValues = sheet.getRange('Q2:Q').getValues();
  var thermostatQs = [];

  for (var i = 0; i < oValues.length; i++) {
    if (oValues[i][0] === "THERMOSTATS") {
      thermostatQs.push(qValues[i][0]);
    }
  }

  var allThermostatQsEmpty = thermostatQs.length > 0 && thermostatQs.every(function(value) {
    return value === "" || value === null;
  });

  if (allThermostatQsEmpty) {
    var confirmThermostats = ui.alert(
      'Confirmation',
      'This job has no thermostats, was this intentional?',
      ui.ButtonSet.YES_NO
    );
    if (confirmThermostats == ui.Button.NO) {
      ui.alert('Notice', 'Please add the appropriate thermostat(s) and try again.', ui.ButtonSet.OK);
      return;
    }
  }

    // --- Oil furnace model number check ---
  var modelRange = sheet.getRange('F3:F41').getValues().flat();
  var hasOilFurnace = modelRange.some(function(value) {
    return typeof value === 'string' && value.trim().toUpperCase().startsWith("OM");
  });

  if (hasOilFurnace) {
    var confirmBurner = ui.alert(
      'Confirmation',
      'This model number looks like an oil furnace, is the respective burner included on the material list?',
      ui.ButtonSet.YES_NO
    );
    if (confirmBurner == ui.Button.NO) {
      ui.alert('Notice', 'Please add the appropriate burner for the oil furnace and try again.', ui.ButtonSet.OK);
      return;
    }
  }

  var newStatusRanges = ['H3:H41', 'M3:M41', 'R3:R41', 'W3:W41'];
  for (var i = 0; i < newStatusRanges.length; i++) {
    var values = sheet.getRange(newStatusRanges[i]).getValues().flat();
    if (values.some(function (v) { return v === true; })) {
      ui.alert(
        'Error',
        'There are items that have the "New?" status checked next to them, this is only intended for materials being added to existing lists only, please uncheck them and try again',
        ui.ButtonSet.OK
      );
      return;
    }
  }

  var linesets = sheet.getRange('Q105:Q107').getValues().flat()
    .concat(sheet.getRange('Q109:Q111').getValues().flat());
  var linehide = sheet.getRange('Q113:Q154').getValues().flat()
    .concat(sheet.getRange('Q156:Q159').getValues().flat());
  var hasLinesets = linesets.some(
    (value) => typeof value === 'number' && !isNaN(value)
  );
  var hasLinehide = linehide.some(
    (value) => typeof value === 'number' && !isNaN(value)
  );
  if (hasLinesets && !hasLinehide) {
    var confirmLinehide = ui.alert(
      'Confirmation',
      'There are linesets on this list but no linehide, does this job require linehide?',
      ui.ButtonSet.YES_NO
    );
    if (confirmLinehide == ui.Button.YES) {
      ui.alert('Notice', 'Please add linehide needed for this job.', ui.ButtonSet.OK);
      return;
    }
  }

  var ductworkRange = sheet.getRange('K33:K41').getValues().flat();
  var hasDuctwork = ductworkRange.some(
    (value) => value !== "ENTER DIMENSIONS HERE"
  );

  var jobType = sheet.getRange("C7").getValue().trim();
  var confirmJobType = ui.alert(
    'Confirmation',
    'Are you sure this job is for "' + jobType + '"?',
    ui.ButtonSet.YES_NO
  );
  if (confirmJobType == ui.Button.NO) {
    ui.alert('Finalization canceled. Please review the job type and try again.', ui.ButtonSet.OK);
    return;
  }

  if (hasDuctwork) {
    showSidebarBellMetro();
    return;
  }

  finalizeMaterialListBellMetro();
}

function getSidebarDataBellMetro() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Material Input");
  var jobName = sheet.getRange("C4").getValue().trim();
  var jobType = sheet.getRange("C7").getValue().trim();
  Logger.log("getSidebarDataBellMetro - jobName: " + jobName);
  Logger.log("getSidebarDataBellMetro - jobType: " + jobType);
  
  var folderName;
  switch(jobType) {
    case "Bell Mechanical":
      folderName = "Material Lists - Bell Mechanical";
      break;
    case "Pack-Timco":
      folderName = "Material Lists - Pack Timco";
      break;
    case "Metro-Aire":
      folderName = "Material Lists - Metro Aire";
      break;
    case "MCK Plumbing":
      folderName = "Material Lists - MCK Plumbing";
      break;
    default:
      folderName = "Material Lists - Default";
  }
  Logger.log("getSidebarDataBellMetro - folderName: " + folderName);
  
  var folders = DriveApp.getFoldersByName(folderName);
  if (!folders.hasNext()) {
    throw new Error("Folder '" + folderName + "' does not exist. Please create it before proceeding.");
  }
  var folder = folders.next();
  Logger.log("getSidebarDataBellMetro - found folder: " + folder.getName());
  
  var folderId = folder.getId();
  Logger.log("getSidebarDataBellMetro - folderId: " + folderId);
  
  return { folderId: folderId, jobName: jobName };
}

function showSidebarBellMetro() {
  var htmlOutput = HtmlService.createHtmlOutputFromFile('sidebarBellMetro')
    .setTitle('Upload Drawings')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

function uploadFileBellMetro(fileData, fileName, folderId, jobName) {
  try {
    Logger.log("uploadFileBellMetro() called");
    Logger.log("Folder ID: " + folderId);
    Logger.log("Job Name: " + jobName);
    Logger.log("File Name: " + fileName);
    Logger.log("File Data (first 100 chars): " + fileData.substring(0, 100));

    var parts = fileData.split(",");
    if (parts.length < 2) {
      throw new Error("File data is not in the expected Data URL format.");
    }
    var base64Data = parts[1];
    Logger.log("Base64 data length: " + base64Data.length);

    var folder = DriveApp.getFolderById(folderId);
    if (!folder) {
      throw new Error("Folder not found with folderId: " + folderId);
    }

    var filesInFolder = folder.getFiles();
    var drawingNumber = 1;
    while (filesInFolder.hasNext()) {
      var file = filesInFolder.next();
      if (file.getName().startsWith("Material List - " + jobName + " - Drawing")) {
        drawingNumber++;
      }
    }

    var newFileName = "Material List - " + jobName + " - Drawing " + drawingNumber;
    Logger.log("Creating file with name: " + newFileName);
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), "application/octet-stream", fileName);
    var newFile = folder.createFile(blob).setName(newFileName);
    Logger.log("File created: " + newFile.getName());
    
    return true;
  } catch (e) {
    Logger.log("uploadFileBellMetro error: " + e.toString());
    throw e;
  }
}

function getOrCreateFolderBellMetro(jobName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Material Input");
  var jobType = sheet.getRange("C7").getValue().trim();
  var folderName;
  switch(jobType) {
    case "Bell Mechanical":
      folderName = "Material Lists - Bell Mechanical";
      break;
    case "Pack-Timco":
      folderName = "Material Lists - Pack Timco";
      break;
    case "Metro-Aire":
      folderName = "Material Lists - Metro Aire";
      break;
    case "MCK Plumbing":
      folderName = "Material Lists - MCK Plumbing";
      break;
    default:
      folderName = "Material Lists - Default";
  }
  var folders = DriveApp.getFoldersByName(folderName);
  if (!folders.hasNext()) {
    throw new Error("Folder '" + folderName + "' does not exist. Please create it before proceeding.");
  }
  var folder = folders.next();
  return folder.getId();
}

function resumeProcessBellMetro() {
  Logger.log("resumeProcessBellMetro() called");
  
  if (isResumeProcessCalled) {
    Logger.log("resumeProcessBellMetro() exited early because it was already called.");
    return;
  }
  
  isResumeProcessCalled = true;
  Logger.log("Calling finalizeMaterialListBellMetro()");
  finalizeMaterialListBellMetro();
}

function finalizeMaterialListBellMetro() {
  Logger.log("finalizeMaterialListBellMetro() called");
  
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Material Input");
  var sheetName = sheet.getRange('C4').getValue();
  
  var response = ui.alert(
    'Confirmation', 
    'Are you sure you want to create a finalized copy of the material list?\n\nThis cannot be undone!', 
    ui.ButtonSet.YES_NO
  );
  
  if (response == ui.Button.YES) {
    Logger.log("Finalization confirmed by user");
    
    // Store original formulas
    var c8Formula = sheet.getRange('C8').getFormula();
    var c9Formula = sheet.getRange('C9').getFormula();
    
    // Replace formulas with static text
    sheet.getRange('C8:C9').setValues(sheet.getRange('C8:C9').getValues());
    
    var jobType = sheet.getRange("C7").getValue().trim();
    var folderName;
    switch(jobType) {
      case "Bell Mechanical":
        folderName = "Material Lists - Bell Mechanical";
        break;
      case "Pack-Timco":
        folderName = "Material Lists - Pack Timco";
        break;
      case "Metro-Aire":
        folderName = "Material Lists - Metro Aire";
        break;
      case "MCK Plumbing":
        folderName = "Material Lists - MCK Plumbing";
        break;
      default:
        folderName = "Material Lists - Default";
    }
    
    var newName = 'Material List - ' + sheetName;
    var newSs = ss.copy(newName);
    
    // Restore original formulas after copy
    sheet.getRange('C8').setFormula(c8Formula);
    sheet.getRange('C9').setFormula(c9Formula);
    
    var noTouchySheet = ss.getSheetByName("no touchy please");
    if (noTouchySheet && noTouchySheet.getRange("A1").getValue() === "ROUGH DRAFT") {
      Logger.log("Trashing the original spreadsheet");
      var originalFileId = ss.getId();
      DriveApp.getFileById(originalFileId).setTrashed(true);
    }
    
    var newNoTouchySheet = newSs.getSheetByName("no touchy please");
    if (newNoTouchySheet) {
      Logger.log("Clearing content of new 'no touchy please' sheet");
      newNoTouchySheet.getRange("A1").clearContent();
    }
    
    var newSsId = newSs.getId();
    var newFile = DriveApp.getFileById(newSsId);
    
    // Share with Pack-Timco specific email if needed
    if(jobType === "Pack-Timco"){ newFile.addEditor('wdigiacomo@packtimco.com'); }
    else { newFile.addEditor('blake@bellmech.com'); }
    
    newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    
    var folders = DriveApp.getFoldersByName(folderName);
    if (!folders.hasNext()) {
      throw new Error("Folder '" + folderName + "' does not exist. Please create it before finalizing.");
    }
    var folder = folders.next();
    Logger.log("Moving file to the correct folder");
    newFile.moveTo(folder);
    
    clearCells(sheet, 'C4:C7');
    clearCells(sheet, 'G3:G');
    clearCells(sheet, 'L3:L');
    clearCells(sheet, 'Q3:Q');
    clearCells(sheet, 'V3:V');
    
    sheet.getRange('F3:F41').setValue('ENTER MODEL NUMBER HERE');
    sheet.getRange('K3:K41').setValue('ENTER DIMENSIONS HERE');
    sheet.getRange('P44:P87').setValue('NAME AND MODEL NUMBER OR DIMENSIONS');
    
    Logger.log("Finalization complete, notifying user");
    ui.alert('The material list has been finalized and shared with ' + (jobType === "Pack-Timco" ? 'Wayne' : 'Blake'));
  }
  
  isResumeProcessCalled = false;
}

function clearCells(sheet, rangeStr) {
  var range = sheet.getRange(rangeStr);
  var values = range.getValues();
  
  for (var i = 0; i < values.length; i++) {
    for (var j = 0; j < values[i].length; j++) {
      if (values[i][j] !== "~") {
        values[i][j] = "";
      }
    }
  }
  
  range.setValues(values);
}
