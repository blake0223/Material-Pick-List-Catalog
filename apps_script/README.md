# `apps_script/` — live Apps Script mirror

A **flat, 1:1 mirror** of the Apps Script project bound to the
[Material List - Hickory Master File](https://docs.google.com/spreadsheets/d/1c1Wlxb74wLK-OcIYRJzjzXKBlHStzl-cRV-GKGbq2pY/edit)
spreadsheet. `clasp` pushes this folder to the live script (`.clasp.json` sets
`rootDir: apps_script`).

> ⚠️ **Keep this folder flat. Do not create subfolders or rename files.**
> HTML files are loaded by bare name (e.g. `createHtmlOutputFromFile('sidebarBellMetro')`)
> and `appsscript.json` must sit at the root — `clasp` would rename files on
> deploy and break the app.

For how these files fit together, see [`../docs/architecture.md`](../docs/architecture.md).

## Files by subsystem

### Triggers
| File | Key functions |
|------|---------------|
| `onOpen.gs` | builds the **Tools** menu |
| `onEdit.gs` | reactive formatting on *Material Input*; auto-fills kits on *Change Out Kits* |

### Material list building & submission
| File | Key functions |
|------|---------------|
| `Submit New Material Lists.gs` | `showSidebarBellMetro`, `getSidebarDataBellMetro`, `insertModels_`, `finalizeMaterialListBellMetro`, `uploadFileBellMetro`, `findFinancialSummaryEmail` |
| `Checklist Creation.gs` | `generateChecklist` |
| `Data Only Update.gs` | `copyDataOnly` |
| `Save Draft.gs` | `DraftList` |
| `sidebarBellMetro.html` | the submission sidebar UI |

### Change-out kits
| File | Key functions |
|------|---------------|
| `Changeout Kits Update.gs` | `applyKitListUpdate` |
| `Confirm Selected Kits.gs` | `runMaterialUpdate` |
| `Clear Changeout Kit Selection.gs` | `clearChangeOutKits` |

### Custom kits
| File | Key functions |
|------|---------------|
| `Custom Kit Creation.gs` | `manageKits`, `saveMaterialsToCustomList`, `loadMaterialsFromCustomList`, `editMaterialsFromCustomList` |

### Adding materials
| File | Key functions |
|------|---------------|
| `Add by Search.gs` | `submitItem` |
| `Additional Materials.gs` | `generateAdditionalMaterials` |
| `Additional Materials (PackTimco).gs` | `generateAdditionalMaterials` (PackTimco variant) |
| `Clear Search.gs` / `Clear Input.gs` | `clearSearch`, `resetMaterialInput`, `clearCells` |

### Pricing
| File | Key functions |
|------|---------------|
| `Price Estimator.gs` | `runInventoryCheck` (password-gated), `runInventoryOnly`, `runPriceBreakdown`, `estimatePrice`, `levenshtein` |
| `Price Estimator (AI Add).gs` | AI-assisted add |

### Printing & email
| File | Key functions |
|------|---------------|
| `Print Button.gs` / `Print Button (PackTimco).gs` | `printGeneratedMaterialList`, `handlePrintMaterialSelection` |
| `PrintChecklist.html` | print template |
| `Email Patch Notes.gs` | `sendEmailsToSalesmen` |

### Update Wizard (fan-out to per-user files)
| File | Key functions |
|------|---------------|
| `Update Wizard Magic.gs` | `updateScriptFromMaster`, `applyFinalFormatting`, `matchColumnWidths`, `applyAlternatingColors`, `applySpecificMerges` |
| `Checkbox Update.gs` | `copyCheckboxesToTargetFiles` |
| `Hardernotsmarder.gs` | `copySelectedTabsToTargetURLs`, `copySheetsToTargets` |
| `Update Precheck.gs` | `checkMaterialInput` |
| `SheetSelector.html` | tab-picker UI |

### Help
| File | Key functions |
|------|---------------|
| `Help Button.gs` | `showFAQModal`, `getAnswer` |
| `faq_modal.html` | FAQ modal UI |

### Tooling / maintenance
| File | Key functions |
|------|---------------|
| `JSON EXPORT.gs` | `exportEverythingToJson` — the exporter that produced this repo |

### Manifest
| File | |
|------|--|
| `appsscript.json` | scopes, runtime (V8), timezone, web-app config |
