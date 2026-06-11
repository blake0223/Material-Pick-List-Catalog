# ServiceTitan Estimate Proxy

A standalone Apps Script **web app** that returns an estimate's **Equipment + Material**
line items to the Material List sheet — without the sheet ever holding ServiceTitan
credentials.

It **reuses the inventory trackers' credential source** (GCP Secret Manager project
`inventory-scripts`, secrets named `wms-<tenant>`) and mirrors their `SecretManager` +
`STAuth` patterns. **It does not touch or depend on the tracker projects.**

```
Material List sheet ──GET ?estimateId&key──▶ this proxy (runs as owner)
                                              ├─ reads wms-<tenant> from Secret Manager
                                              ├─ calls /sales/v2/.../estimates
                                              └─ returns Equipment + Materials JSON
```

- **Multi-tenant:** the `tenant` request param selects the secret (`wms-<tenant>`).
- **Secret isolation:** deployed *Execute as ME (owner)*, so callers never get Secret
  Manager access and never see the ST Client Secret. A shared `?key=` gates requests.

## Files
| File | Role |
|------|------|
| `WebApp.gs` | `doGet` entry point, key auth, `setProxyKey()`, `testEstimate()` |
| `Estimates.gs` | Fetch estimate by id or job number; filter to Equipment + Materials |
| `STAuth.gs` | ServiceTitan OAuth + `stFetch_` (per-tenant token cache) |
| `SecretManager.gs` | Read `wms-<tenant>` creds from Secret Manager |
| `appsscript.json` | Scopes (`cloud-platform`, `external_request`) + web app config |

## Provisioning (one-time, by the proxy owner)

> The owner must already have **Secret Manager Secret Accessor** on the `wms-*`
> secrets in project `inventory-scripts` — the same access the trackers run under.

1. **Create the standalone project** (locally, from this folder):
   ```bash
   cd st_estimate_proxy
   clasp.cmd create --type standalone --title "ServiceTitan Estimate Proxy" --rootDir .
   ```
   That writes the real `scriptId` into `.clasp.json`. Commit it (replaces the
   `REPLACE_WITH_PROXY_SCRIPT_ID` placeholder) — auto-deploy then takes over.
   *(Or create it in the Apps Script UI and paste the scriptId into `.clasp.json`.)*
2. **Link it to the trackers' GCP project:** Apps Script editor → Project Settings →
   Google Cloud Platform (GCP) Project → set project number **`526554740871`**
   (`inventory-scripts`). This is what lets `getOAuthToken()` reach Secret Manager.
3. **Push the code:** `clasp.cmd push` (or let the `Deploy ServiceTitan Estimate Proxy`
   Action do it once the scriptId is committed).
4. **Set the shared key:** in the editor, run `setProxyKey('<a long random string>')`.
5. **Deploy as web app:** Deploy → New deployment → Web app → *Execute as: Me*,
   *Who has access: Anyone* → copy the `/exec` URL.
6. **Smoke test:** run `testEstimate()` (defaults to Bell estimate `229499692`) and
   check the log shows Equipment + Material counts.
7. Hand me the **web app URL** (the key stays secret) and I'll wire the Material List
   "Import from ServiceTitan" side against it.

## Request / response

```
GET <web-app-url>?action=estimateItems&tenant=bell-mechanical&estimateId=229499692&key=…
GET <web-app-url>?action=estimateItems&tenant=bell-mechanical&jobNumber=12345&key=…
```
```json
{
  "ok": true,
  "tenant": "bell-mechanical",
  "estimate": {
    "estimateId": "229499692",
    "name": "Lennox 13 seer",
    "status": "Sold",
    "items": [
      { "type": "Equipment", "code": "CK40CT-36B", "name": "Lennox Cased Upflow 3.0 Ton Coil", "qty": 1, "total": 0 },
      { "type": "Material",  "code": "1/2 1-ASST", "name": "115V Condensate Pump", "qty": 1, "total": 0 }
    ],
    "counts": { "Equipment": 3, "Material": 46 }
  }
}
```

## Notes
- Token cache lives in Script Properties keyed by secret name (`ST_TOKEN_wms-…`) —
  runtime cache, not a secret.
- `tenant=bell-mechanical` → secret `wms-bell-mechanical`. Override with `&secret=` if a
  tenant's secret is named differently.
- Job-number lookup resolves number → job id → active estimates and prefers a sold
  estimate. Confirm the exact `jobNumber` behavior on first live test.
