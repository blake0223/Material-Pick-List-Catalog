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

## Security note

`.clasprc.json` (created by `clasp login`) holds your OAuth refresh token — it's
already in `.gitignore`. The **script ID** in `.clasp.json` is not a secret (it's
just an identifier, like a doc URL), so it's safe to keep in the repo.
