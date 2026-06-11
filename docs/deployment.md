# Working with this project via `clasp`

[`clasp`](https://github.com/google/clasp) is Google's CLI for syncing Apps
Script projects with local files. This repo is already configured for it —
`.clasp.json` points at the live script and `apps_script/` as the source root.

| Setting | Value |
|---------|-------|
| Script ID | `1gt0MFh54vmWMD0Zgt27rbhxDmPGpvZsYp68yXKU_90oSwd2MCq1tyrFQ` |
| `rootDir` | `apps_script/` |
| Bound spreadsheet | [Material List - Hickory Master File](https://docs.google.com/spreadsheets/d/1c1Wlxb74wLK-OcIYRJzjzXKBlHStzl-cRV-GKGbq2pY/edit) |

## One-time setup

```bash
# 1. Install clasp (needs Node 18+)
npm install -g @google/clasp

# 2. Enable the Apps Script API for your account (if you haven't already)
#    https://script.google.com/home/usersettings  ->  turn ON

# 3. Log in — opens a browser for Google OAuth.
#    This writes ~/.clasprc.json (your personal token — git-ignored, never commit it)
clasp login
```

That's it — no `clasp clone` needed, because `.clasp.json` is already in the repo.

## Daily workflow

```bash
# Pull the latest from the live Apps Script project into apps_script/
clasp pull

# Push your local changes back up to the live project
clasp push

# Open the script editor in a browser
clasp open
```

Always work on a branch and open a PR (this is the `claude/...` branch workflow
you're already using). Push to the live script with `clasp push` only once a
change is reviewed/merged, so the deployed project stays in sync with `main`.

## ⚠️ Heads-up: `.gs` vs `.js`

The files in `apps_script/` were exported as **`.gs`**, which is what the
Apps Script editor shows. `clasp` happily **pushes** `.gs`, `.html`, and
`appsscript.json` — but when you run `clasp pull`, it writes server files back
as **`.js`** (clasp's default). That would leave you with both `Foo.gs` and
`Foo.js` for the same Apps Script file, which then collide on the next push.

Pick one convention and stick with it:

- **Keep `.gs` (recommended for matching the editor):** after a `clasp pull`,
  rename the new `.js` files back to `.gs` (or just `git checkout` the `.gs`
  files and re-apply changes by hand for small edits).
- **Switch to `.js`:** do a one-time `clasp pull` into a clean `apps_script/`,
  delete the old `.gs` files, and commit the `.js` versions. After that, pull
  and push stay consistent with no renaming.

If you plan to round-trip through `clasp pull` regularly, the `.js` convention
is the smoother path. Let me know and I can convert the repo to `.js` in one go.

## Auto-deploy to the live sheet (GitHub Actions)

There's a workflow at `.github/workflows/deploy-clasp.yml` that pushes
`apps_script/` to the **live** Apps Script project automatically whenever changes
land on `main` (and can be triggered manually from the Actions tab). Once it's
set up, edits flow to the live spreadsheet on every merge — no manual `clasp push`.

**One-time setup (must be done by a human — it needs your Google login):**

```bash
# 1. Authenticate locally. Opens a browser; writes ~/.clasprc.json
npm install -g @google/clasp@2.4.2
clasp login

# 2. Print the credential file so you can copy it
cat ~/.clasprc.json
```

3. In GitHub: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `CLASPRC_JSON`
   - Value: paste the **entire contents** of `~/.clasprc.json`

That's it. After the secret exists, merging to `main` deploys to the live script.
You can confirm it works by running the workflow manually (Actions tab →
"Deploy to live Apps Script" → Run workflow).

> The account you `clasp login` with must have edit access to the script. The
> token in `CLASPRC_JSON` is sensitive — it lives only in GitHub's encrypted
> secrets, never in the repo.

## PR validation gate (`validate.yml`)

`.github/workflows/validate.yml` runs on every PR that touches `apps_script/`. It
confirms `appsscript.json` is valid JSON and that no `.gs`/`.html` file is empty,
so broken code can't be merged and auto-deployed to the live sheet.

To make it a hard gate that auto-merge waits on:
- **Settings → General → Pull Requests → ✅ Allow auto-merge**
- **Settings → Branches → add a rule for `main` → require the `validate` check**

## The full pipeline

```
branch  →  PR (validate runs)  →  merge to main  →  deploy-clasp.yml (clasp push)  →  live sheet
```

Because `deploy-clasp.yml` uses `clasp push --force`, **the repo is the source of
truth** — don't hand-edit code in the Apps Script editor or the next deploy
overwrites it.

## Security note

`.clasprc.json` (created by `clasp login`) holds your OAuth refresh token — it's
already in `.gitignore`. The **script ID** in `.clasp.json` is not a secret (it's
just an identifier, like a doc URL), so it's safe to keep in the repo.
