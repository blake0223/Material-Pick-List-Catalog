# Material Pick List Catalog

Source-of-truth mirror of the **Material List - Hickory Master File** — a Google
Sheets + Apps Script tool that Bell / Metro salespeople use to build HVAC
material pick lists, assemble change-out kits, estimate pricing, and push the
finished list out to per-user job files.

- 📄 **Live spreadsheet:** [Material List - Hickory Master File](https://docs.google.com/spreadsheets/d/1c1Wlxb74wLK-OcIYRJzjzXKBlHStzl-cRV-GKGbq2pY/edit)
- 🧩 **Apps Script:** container-bound to that spreadsheet (script ID `1gt0MFh5…tyrFQ`)
- 🚀 **Deploys automatically** to the live sheet on every merge to `main` (see below)

---

## Repository map

| Path | What it is |
|------|------------|
| [`apps_script/`](apps_script/) | **The code.** A flat 1:1 mirror of the live Apps Script project (`.gs` + `.html` + `appsscript.json`). This is what `clasp` pushes to the sheet. See [`apps_script/README.md`](apps_script/README.md) for a file-by-file index. |
| [`spreadsheet/`](spreadsheet/) | CSV snapshots of all 14 sheets (displayed values), for reference while reading the code. See [`spreadsheet/README.md`](spreadsheet/README.md). |
| [`docs/architecture.md`](docs/architecture.md) | **How the app works** — the subsystems, which files implement them, and which sheets they read/write. |
| [`docs/data-model.md`](docs/data-model.md) | What each of the 14 sheets is for and how the code uses it. |
| [`docs/deployment.md`](docs/deployment.md) | The clasp + GitHub Actions pipeline, and how to set it up / change it. |
| [`reference/raw_export.json`](reference/) | The original combined export bundle (code + sheet snapshot), kept verbatim as a backup. |
| `.github/workflows/` | `validate.yml` (PR check) and `deploy-clasp.yml` (auto-deploy to the live sheet). |

> ⚠️ **`apps_script/` is intentionally flat — do not move files into subfolders.**
> HTML files are loaded by bare name in code (e.g. `createHtmlOutputFromFile('sidebarBellMetro')`),
> and `clasp` would rename them on deploy, breaking the app.

---

## How it works, end to end

### 1. The product
A salesperson opens the spreadsheet, fills in job/equipment details on the
**Material Input** sheet, and uses the **Tools** menu + a sidebar to:

1. Auto-build **change-out kits** from a catalog (`Kit Lists` sheet).
2. Add extra **materials / fittings** (search-driven or manual).
3. Run a **price estimate** (catalog lookup + GPT fallback for unknown items).
4. Generate a clean **Generated Material List**, print it, and email it.
5. Push the finished tool out to each salesperson's **own copy** via the Update Wizard.

The full subsystem-by-subsystem breakdown is in [`docs/architecture.md`](docs/architecture.md).

### 2. The repo ↔ sheet sync (clasp)
The repo is the **source of truth**. [`clasp`](https://github.com/google/clasp)
maps `apps_script/` to the live Apps Script project (configured in `.clasp.json`).
You can pull/push manually, but normally you don't have to — see below.

### 3. Automatic deployment
```
edit on a branch  →  open PR  →  validate check passes  →  merge to main  →  deploy-clasp.yml runs `clasp push`  →  live sheet updated
```
- **`validate.yml`** runs on every PR touching `apps_script/`: confirms the
  manifest is valid JSON and no source file is empty, so broken code can't reach
  the sheet.
- **`deploy-clasp.yml`** runs on every push to `main`: installs clasp, restores
  credentials from the `CLASPRC_JSON` repo secret, and runs `clasp push --force`.

Because deploy uses `--force`, **the repo wins** — don't hand-edit code in the
Apps Script editor, or the next deploy will overwrite it. Full setup and the
`.gs` vs `.js` gotcha are documented in [`docs/deployment.md`](docs/deployment.md).

---

## Making a change

1. Branch off `main`, edit files in `apps_script/`.
2. Open a PR — the `validate` check runs.
3. Merge — the change auto-deploys to the live spreadsheet within ~30s.

Reference data in `spreadsheet/` and `reference/` is documentation only; editing
it has no effect on the live sheet.
