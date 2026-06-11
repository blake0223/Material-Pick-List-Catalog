# Auto-export the spreadsheet into the repo

The sheet can push a fresh snapshot of itself **straight into this repo** — no
manual download/upload. Flow:

```
Tools → Sync to GitHub   (exportToGitHub in JSON EXPORT.gs)
   → commits reference/raw_export.json to the repo via the GitHub API
   → process-export.yml regenerates spreadsheet/*.csv + spreadsheet/README.md
```

## One-time setup

1. **Create a token.** GitHub → **Settings → Developer settings → Fine-grained
   personal access tokens → Generate new token**:
   - Repository access: **Only select repositories** → `Material-Pick-List-Catalog`
   - Permissions: **Contents → Read and write**
   - Copy the token (starts with `github_pat_…`).

2. **Store it in the script.** In the spreadsheet: **Extensions → Apps Script →
   Project Settings (gear) → Script Properties → Add script property**:
   | Property | Value |
   |----------|-------|
   | `GITHUB_TOKEN` | the fine-grained PAT from step 1 |
   | `GITHUB_REPO` | `blake0223/Material-Pick-List-Catalog` *(optional — this is the default)* |
   | `GITHUB_BRANCH` | `main` *(optional — default)* |

That's it.

## Running it

- **On demand:** spreadsheet menu **Tools → Sync to GitHub**.
- **On a schedule (truly automatic):** in the Apps Script editor → **Triggers**
  (clock icon) → **Add Trigger** → function `exportToGitHub`, event source
  *Time-driven*, e.g. *Day timer*. It will push a fresh snapshot on that cadence.

After it runs, `reference/raw_export.json` updates, and within ~30s the
`process-export` Action commits the regenerated CSVs.

## Notes / security
- The token lives only in the script's Script Properties (server-side), never in
  the repo. Scope it to this one repo with Contents-only access so a leak is
  low-impact, and rotate it if exposed.
- This writes data files (`reference/`, `spreadsheet/`) — it does **not** touch
  `apps_script/`, so it never triggers a code deploy.
- `process-export.yml` commits with the built-in `GITHUB_TOKEN`, which does not
  re-trigger workflows, so there's no loop.
