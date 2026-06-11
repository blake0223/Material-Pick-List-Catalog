# Material-Pick-List-Catalog

Source mirror of the **Material List - Hickory Master File** — a Google Sheets +
Apps Script tool for building HVAC material pick lists, change-out kits, and
price estimates.

- 📄 **Spreadsheet:** [Material List - Hickory Master File](https://docs.google.com/spreadsheets/d/1c1Wlxb74wLK-OcIYRJzjzXKBlHStzl-cRV-GKGbq2pY/edit)
- 🧩 **Apps Script:** container-bound to the spreadsheet above

## Layout

| Path | What's there |
|------|--------------|
| [`apps_script/`](apps_script/) | All 31 Apps Script files (`.gs` / `.html`) + `appsscript.json` manifest |
| [`spreadsheet/`](spreadsheet/) | CSV snapshot of all 14 sheets (displayed values) |
| `raw_export.json` | The original combined export bundle, kept intact for fidelity |
| [`CLASP.md`](CLASP.md) | How to sync this repo with the live Apps Script project via `clasp` |

## What the tool does

The script adds a **Tools** menu to the spreadsheet and a sidebar UI that lets a
salesperson assemble a material list for an HVAC job. High-level capabilities,
inferred from the source:

- **Material list generation** — build/submit lists from the `Material Input`
  sheet into a `Generated Material List` (`Submit New Material Lists`,
  `Checklist Creation`, `Data Only Update`).
- **Change-out kits** — pick standard kits by system type/size from `Kit Lists`,
  confirm/clear selections (`Changeout Kits Update`, `Confirm Selected Kits`,
  `Clear Changeout Kit Selection`), and build custom kits (`Custom Kit Creation`).
- **Pricing** — estimate prices against the `Pricing` / `Pricing Guts` sheets
  (`Price Estimator`, `Price Estimator (AI Add)`), including a Tools-menu
  inventory/price breakdown flow.
- **Add by search / additional materials** — search-driven item adds
  (`Add by Search`, `Additional Materials`, `Additional Materials (PackTimco)`).
- **Printing & email** — print formatted checklists (`Print Button`,
  `PrintChecklist.html`) and email patch notes / financial summaries
  (`Email Patch Notes`, `findFinancialSummaryEmail`).
- **Update wizard** — push updates out to per-user dedicated files listed in the
  `Update Wizard` sheet (`Update Wizard Magic`, `Update Precheck`).
- **Triggers** — `onOpen` builds the menu; `onEdit` drives reactive sheet behavior.

See [`apps_script/README.md`](apps_script/README.md) and
[`spreadsheet/README.md`](spreadsheet/README.md) for the full file/sheet inventory.

## Regenerating this snapshot

This mirror was produced by an Apps Script export function run inside the bound
project (it calls the Apps Script API on itself for the code and snapshots each
sheet's displayed values). Some larger sheets are truncated to 500 rows in the
CSVs — re-run the export with `MAX_ROWS_PER_SHEET = -1` to capture them fully.
