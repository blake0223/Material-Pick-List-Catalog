# Data model — the 14 sheets

Source: [Material List - Hickory Master File](https://docs.google.com/spreadsheets/d/1c1Wlxb74wLK-OcIYRJzjzXKBlHStzl-cRV-GKGbq2pY/edit)
(ID `1c1Wlxb74wLK-OcIYRJzjzXKBlHStzl-cRV-GKGbq2pY`). CSV snapshots of each sheet
live in [`../spreadsheet/`](../spreadsheet/) — these are **displayed values**
(formula results, not formulas), and the larger sheets are truncated to 500 rows.

| Sheet | Size (r×c) | Role | Read/written by |
|-------|-----------|------|-----------------|
| **Material Input** | 992×24 | **Hub.** Job info, equipment/models (F3:F41), ductwork dims (K3:K41), materials & fittings. | Most subsystems; formatted reactively by `onEdit`. |
| **Change Out Kits** | 1024×6 | Kit picker; selecting a kit (col C) auto-fills its materials. | `onEdit`, `Changeout Kits Update`, `Confirm Selected Kits`, `Clear Changeout Kit Selection`. |
| **Kit Lists** | 604×5 | **Kit catalog**: Category / System Type / System Size / Material / Quantity. The source for change-out kit contents. | `onEdit` lookup, `Changeout Kits Update`. |
| **Generated Material List** | 26×9 | The finished, formatted output list for a job. | `Submit New Material Lists`, `Checklist Creation`, print/email. |
| **Additional Material** | 26×9 | Extra items added beyond kits. | `Additional Materials`, `Add by Search`. |
| **Pricing** | 1346×3 | Item Name / Estimated Price / Result Type. Estimator writes price + type back into cols B/C. | `Price Estimator`. |
| **Pricing Guts** | 1806×1+ | Backing data / examples for the price estimator's matching + GPT prompts. | `Price Estimator`. |
| **Update Wizard** | 1000×6 | Per-user roster: Name / Email / Dedicated File URL. Drives the fan-out updates and salesperson emails. | `Update Wizard Magic`, `Email Patch Notes`, `Checkbox Update`, `Data Only Update`. |
| **Custom List Storage** | 1×4 | Persisted custom kits: Name / Material / Qty / "Currently Editing List Name". | `Custom Kit Creation`. |
| **FAQs** | 13×2 | Question/answer pairs for the help modal. | `Help Button`. |
| **INSTRUCTIONS** | 104×2 | Human-facing usage instructions (not read by code). | — |
| **Scheduled Jobs** | 1×1 | Scratch/state for scheduling. | (minimal) |
| **AYPA?** | empty | Empty / unused. | — |
| **no touchy please** | 1×1 | Internal scratch/helper sheet referenced ~7×; holds working state, not user data. | several scripts |

## Notes
- **Placeholders matter.** Empty equipment/dimension cells are filled with
  sentinel text ("ENTER MODEL NUMBER HERE", "ENTER DIMENSIONS HERE", "NAME AND
  MODEL NUMBER OR DIMENSIONS") by `onEdit`; the estimator and submit flows treat
  those as "ignore / empty slot."
- **Kit lookups** key on the pair (kit name in col B of *Change Out Kits*) +
  (size in B14) against *Kit Lists* columns B:E.
- **Truncated CSVs:** `Change Out Kits`, `Material Input`, `Update Wizard`,
  `Pricing`, `Pricing Guts`, and `Kit Lists` were capped at 500 rows in the
  export. Re-run `exportEverythingToJson` (in `JSON EXPORT.gs`) with
  `MAX_ROWS_PER_SHEET = -1` to capture them in full.
