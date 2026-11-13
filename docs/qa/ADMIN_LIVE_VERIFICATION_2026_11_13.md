# Consolidated admin — live read-only verification

**Date:** 2026-11-13, completed 03:12:44 UTC  
**Source HEAD:** `9653990e54a0323fade4b63285b7ea6441cdce49`  
**Runtime:** local preview at `http://localhost:8080`, real Lovable Cloud backend  
**Mode:** browser verification with real sessions and backend reads; no production business mutations, notifications, deployments or publication.

## Verdict

**PARTIAL PASS — navigation and read-only admin workflows work, but full role acceptance is not complete.**

- Admin navigation, consolidated tabs, hubs, legacy redirects and tested read-only workflows passed with real backend responses.
- Two presentation/data issues are confirmed: Acquisition metrics are a zeroed stub; AI Intake KPI values wrap digit-by-digit at 384px.
- Positive administrator access and signed-out restriction were verified. Authenticated non-admin denial remains **BLOCKED** until Pavel identifies an existing non-admin account to use. No roles, active context, accounts or assignments were changed.

## Role and access matrix

| Actor | Scenario | Result | Evidence |
|---|---|---|---|
| Pavel, resolved `admin` / `*` | Open `/admin` | PASS | Server RPC resolved `mode=admin`, `role=admin`; real queues/settings rendered. |
| Pavel, admin | Direct HEAD/count reads of operational tables | PASS | `orders`, `analytics_events`, `profiles`, `user_roles`, form configs, `system_config`, `transfer_operators` returned authorized responses. No row contents were exported. |
| Signed-out guest | Open `/admin/catalog?tab=services&action=old` | PASS | Redirected to `/auth` with the complete original path/query in `redirect`. |
| Signed-out guest | Direct `orders` and `transfer_operators` HEAD/count reads | PASS | HTTP 401; no records returned. |
| Signed-out guest | Direct `profiles`, `user_roles`, `analytics_events` HEAD/count reads | PASS | Zero visible rows; no record contents returned. |
| Signed-out guest | Public active form configs and Google Maps browser-key config | PASS / intended contract | Active public configs are readable by explicit policies; `system_config` public policy is restricted to `GOOGLE_MAPS_API_KEY`. No config values or keys were printed. |
| Authenticated non-admin / `uno_team` / owner / vendor | Admin route denial and direct data restrictions | **BLOCKED** | No identified existing non-admin session. Pavel's administrator role overrides admin admission, so switching labels would not prove non-admin enforcement. |

## Consolidated workspaces

The outer tab was clicked in every case; URL state and selected tab were asserted. Every documented backend response in these scenarios was successful.

| Workspace | Tabs | Desktop 1280×1800 | Mobile 384×681 | Real-data observation |
|---|---:|---|---|---|
| Catalog | 5/5 | PASS | PASS, no page overflow | Unified catalog rendered 208 rows; categories, taxonomy, lookups and services returned HTTP 200. |
| Analytics | 4/4 | PASS for navigation | PASS, no page overflow | Visits, revenue and marketing read backend data. **Acquisition content FAIL:** zeroed local stub. |
| Form settings | 2/2 | PASS | PASS for navigation/overflow | 10 lead configs and 23 intake configs loaded; selecting each type rendered its editor without saving. **Intake KPI wrapping FAIL at 384px.** |
| Transfers | 4/4 | PASS | PASS, no page overflow | Orders, operators, SLA and vehicles loaded. Expanding an order loaded `payment_intents`, `order_status_history` and `ledger_entries` with HTTP 200. |
| Google Maps | 2/2 | PASS for navigation | PASS, no page overflow | Settings read HTTP 200; geocode diagnostics returned HTTP 200. Places diagnostics not accepted because its function may update cache. |

Additional hubs:

- `/admin/newbuilds`: PASS; real KPI counts and project/developer rows loaded.
- `/admin/add`: PASS; all eight entry cards rendered and the pending-application count read succeeded.

### Inner read-only flows

| Flow | Result |
|---|---|
| Unified Catalog: Data / Services / Properties / Products | 4/4 PASS; selected state changed and no HTTP/runtime errors occurred. |
| Lead settings: choose a vertical | PASS; 10 choices loaded, editor rendered, no save invoked. |
| Intake settings: choose a vertical | PASS; 23 choices loaded, editor rendered, no save invoked. |
| Transfer order: Finance details | PASS after scoping the action inside the order list; all three financial read endpoints returned HTTP 200. |

## Legacy addresses

**20/20 PASS** in the real admin session:

- `/admin/control` → `/admin`.
- `/admin/master-catalog`, `/admin/services`, `/admin/lookups`, `/admin/taxonomy` → correct Catalog tabs.
- `/admin/acquisition-metrics`, `/admin/investor-metrics`, `/admin/user-analytics`, `/admin/marketing` → correct Analytics tabs.
- `/admin/vehicles`, `/admin/transfers/sla`, `/admin/transfer-operators` → correct Transfers tabs.
- `/admin/intake-configs`, `/admin/lead-configs` → correct Form settings tabs.
- `/admin/diagnostics/google-maps` → Google Maps diagnostics tab.
- `/admin/marketplace/categories`, `/admin/marketplace/subcategories`, `/admin/marketplace/products`, `/admin/marketplace/vendors` → documented Catalog destinations.
- `/admin/newbuilds/console` → `/admin/newbuilds`.

Merged tab redirects preserved query parameters. `/admin/services?action=new&source=old` retained both parameters and opened the existing new-service dialog; it was closed without submitting.

## Confirmed issues and limits

### FAIL — Acquisition metrics are not backed by real analytics

`src/hooks/useAcquisitionMetrics.ts` explicitly returns `EMPTY_SUMMARY`, empty series and `EMPTY_AIRBNB`; its query returns `{}`. The UI therefore presents `$0`, `0.0x` and `0.0%` as if they were measurements. The tab/redirect works, but its data content is not accepted as real analytics.

### FAIL — AI Intake KPI numbers wrap at 384px

In `/admin/settings/forms?tab=intake`, values such as `23` and `276` wrap into separate digits. Source: the fixed three-column KPI grid with icon-plus-value rows in `src/pages/admin/AdminIntakeConfigs.tsx`. The page has no horizontal overflow, but the KPI presentation is not operationally readable.

### BLOCKED — authenticated non-admin role matrix

A separately identified existing non-admin account is required. No account was selected arbitrarily and no role/context/assignment changes were made.

### BLOCKED — full Google Places diagnostics

Opening the diagnostics tab automatically invokes `place-details`; that function can upsert `google_place_cache`. The POST was blocked under the no-change boundary. Tab navigation and geocode GET passed, but full diagnostics are not marked PASS.

### Warning, not a proven outage

The browser logged `Failed to load Google Maps script, retrying in 2 ms.` on some navigations. No associated failed backend response or broken consolidated workflow was established in this pass, so this is not classified as a confirmed maps outage.

## Safety evidence

A network guard allowed GET/HEAD/OPTIONS and only reviewed read RPCs required for auth/context/currency. It blocked:

- `analytics_events`, `user_sessions` and `page_views` telemetry writes;
- `ensure_multi_role_qa_bundle`;
- `place-details` POST because it may update cache;
- all other non-read requests.

No create/update/delete controls were activated. No service status, booking, order, property, tariff, config, role or assignment was changed. No email, WhatsApp or other notification was sent. No migration, edge deployment or publication occurred.

## Commands and result artifacts

```bash
python3 /tmp/browser/admin-live/check_access.py
python3 /tmp/browser/admin-live/check_workspaces.py
python3 /tmp/browser/admin-live/check_mobile.py
python3 /tmp/browser/admin-live/check_rls.py
python3 /tmp/browser/admin-live/check_read_flows.py
python3 /tmp/browser/admin-live/recheck_transfer_detail.py
```

Result JSON and screenshots are under `/tmp/browser/admin-live/`. Screenshots may contain private admin data and are intentionally not copied into public/project documentation.

### Counts

- Consolidated desktop tabs: **17/17 navigation PASS**.
- Consolidated mobile tabs: **17/17 navigation/overflow PASS**.
- Hubs: **2/2 PASS**.
- Legacy redirects: **20/20 PASS**.
- Inner read-only flows: **7/7 PASS** after correcting the transfer-detail selector and rerunning it.
- Browser page errors: **0**.
- Observed backend HTTP errors in the workspace/mobile matrices: **0**.
- Data/content issues: **1 FAIL** (Acquisition stub).
- Mobile presentation issues: **1 FAIL** (Intake KPI wrapping).
- Authenticated non-admin acceptance: **BLOCKED**, not claimed.
