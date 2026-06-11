# Architecture — how the app works

The app is one container-bound Apps Script project attached to the **Material
List - Hickory Master File** spreadsheet. There is no web app UI in normal use;
everything happens **inside the spreadsheet** through three entry points and a
set of sidebars/dialogs.

## Entry points (triggers + menu)

| Trigger | File | What it does |
|---------|------|--------------|
| `onOpen` | `onOpen.gs` | Builds the **Tools** menu: *Run Price Estimate* → `runInventoryCheck`, *Recheck Inventory* → `runInventoryOnly`, *Price Breakdown* → `runPriceBreakdown`, *Equipment Validation* → `findFinancialSummaryEmail`. |
| `onEdit` | `onEdit.gs` | Reactive behavior on edits. On **Material Input**: refills placeholder text ("ENTER MODEL NUMBER HERE", etc.), clears the paired merged cell (C26/C28), and re-applies alternating row colors/formatting. On **Change Out Kits**: when a kit is picked in column C, looks up matching rows in **Kit Lists** by kit name + size and auto-populates the materials. |
| Sidebar / dialogs | `Submit New Material Lists.gs`, `Help Button.gs`, `Hardernotsmarder.gs` | HTML UIs shown via `HtmlService` (see HTML files below). |

## The hub sheet

**`Material Input`** is the center of gravity — ~28 references across the code.
It holds job info, equipment/model numbers (F3:F41), ductwork dimensions
(K3:K41), and materials/fittings. Most subsystems read from or write to it.

## Subsystems

### 1. Material list building & submission
The core flow. Lives mainly in **`Submit New Material Lists.gs`** (the largest
file).
- `showSidebarBellMetro` / `getSidebarDataBellMetro` — opens the sidebar
  (`sidebarBellMetro.html`) and feeds it data.
- `insertModelAtNextOpenSlot_` / `insertModels_` / `runRDSDecisionAndInsert_` —
  insert equipment models into the next open slot in `F3:F41` (qty defaults to 1).
- `uploadFileBellMetro` / `getOrCreateFolderBellMetro` — handle file uploads to Drive.
- `resumeProcessBellMetro` / `finalizeMaterialListBellMetro` — finalize the list.
- Supporting builders: `Checklist Creation.gs` (`generateChecklist`),
  `Data Only Update.gs` (`copyDataOnly`), `Save Draft.gs` (`DraftList`).
- Writes to **Generated Material List**.

### 2. Change-out kits
Pick standard kits and have their materials filled in automatically.
- `onEdit.gs` populates kit materials from **Kit Lists** by kit name + size.
- `Changeout Kits Update.gs` (`applyKitListUpdate`), `Confirm Selected Kits.gs`
  (`runMaterialUpdate`), `Clear Changeout Kit Selection.gs` (`clearChangeOutKits`).
- Reads **Change Out Kits** + **Kit Lists**.

### 3. Custom kits
Build/edit ad-hoc kits and persist them.
- **`Custom Kit Creation.gs`**: `manageKits`, `saveMaterialsToCustomList`,
  `loadMaterialsFromCustomList`, `editMaterialsFromCustomList`,
  `findMatchingCategories`, `loadEquipmentAndStockItems`, `loadDuctworkAndSpecMat`.
- Persists to **Custom List Storage**.

### 4. Adding materials
- `Add by Search.gs` (`submitItem`) — search-driven item add.
- `Additional Materials.gs` / `Additional Materials (PackTimco).gs`
  (`generateAdditionalMaterials`) — two variants (standard vs PackTimco).
- `Clear Search.gs`, `Clear Input.gs` — reset helpers.
- Reads/writes **Additional Material** and **Material Input**.

### 5. Pricing
- **`Price Estimator.gs`**: `runInventoryCheck` (full run, **password-gated** —
  password is `Shibuya`), `runInventoryOnly` (catalog match only),
  `runPriceBreakdown`. Matches items against **Pricing** / **Pricing Guts** using
  a Levenshtein fuzzy match (`levenshtein`, `estimatePrice`, `collect`), and falls
  back to a GPT estimate for unknown parts.
- `Price Estimator (AI Add).gs` — AI-assisted add variant.
- Writes price + result type back into the **Pricing** sheet (cols B/C).

### 6. Printing & email
- `Print Button.gs` / `Print Button (PackTimco).gs`
  (`printGeneratedMaterialList`, `handlePrintMaterialSelection`) + `PrintChecklist.html`.
- `Email Patch Notes.gs` (`sendEmailsToSalesmen`) — emails salespeople (uses the
  **Update Wizard** sheet's Name/Email list).
- `findFinancialSummaryEmail` (in `Submit New Material Lists.gs`) — "Equipment
  Validation" menu item; reads Gmail for a financial-summary email.

### 7. Update Wizard (fan-out to per-user files)
Pushes the master tool out to each salesperson's own copy of the spreadsheet.
- The **Update Wizard** sheet lists Name / Email / Dedicated File URL per user.
- **`Update Wizard Magic.gs`**: `updateScriptFromMaster` copies the master Apps
  Script (by script ID) into each target file, then `applyFinalFormatting`,
  `matchColumnWidths`, `applyAlternatingColors`, `copyTextAndConditionalFormatting`,
  `applySpecificMerges` re-apply formatting.
- `Checkbox Update.gs` (`copyCheckboxesToTargetFiles`), `Data Only Update.gs`,
  `Hardernotsmarder.gs` (`copySelectedTabsToTargetURLs`, uses `SheetSelector.html`),
  `Update Precheck.gs` (`checkMaterialInput`).

### 8. Help
- `Help Button.gs` (`showFAQModal`, `getAnswer`) + `faq_modal.html`, backed by the
  **FAQs** sheet.

### 9. Maintenance / tooling
- `JSON EXPORT.gs` (`exportEverythingToJson`) — exports the whole project + a
  sheet snapshot to a JSON file in Drive. **This is what produced this repo.**

## HTML files (loaded by bare name — do not rename)

| File | Loaded by | Used in |
|------|-----------|---------|
| `sidebarBellMetro.html` | `createHtmlOutputFromFile('sidebarBellMetro')` | Submit New Material Lists |
| `PrintChecklist.html` | `createTemplateFromFile('PrintChecklist')` | Checklist Creation |
| `faq_modal.html` | `createTemplateFromFile('faq_modal')` | Help Button |
| `SheetSelector.html` | `createHtmlOutputFromFile('SheetSelector')` | Hardernotsmarder |

## OAuth scopes (from `appsscript.json`)
Drive (read + file), Spreadsheets, external requests (GPT pricing calls), send
mail, Gmail readonly (financial-summary lookup), container UI, and
`script.projects` (the Update Wizard rewrites other files' scripts).
