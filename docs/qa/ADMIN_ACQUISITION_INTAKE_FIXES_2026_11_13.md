# Acquisition and Intake mobile fixes — 2026-11-13

## Scope and cause
- Acquisition used a local `{}` query with hard-coded zero summaries; no backend analytics were read. Replaced with existing `mcc_channel_metrics` count fields only. Unsupported LTV/CAC, retention, cross-sell and Airbnb figures are no longer presented as measurements.
- Intake forced three narrow cards at 384px; icon/padding plus inherited word-breaking split numbers. Cards now stack below `sm`, and numbers are nonwrapping tabular monospace. No editor or mutation behavior changed.

## Implementation
- `src/hooks/useAcquisitionMetrics.ts`: existing admin-only channel table, narrow count projection, complete paginated read, actor-bound cache, query disabled until admin admission. Bangkok inclusive 7/30/90 civil-day periods. Missing/null metrics remain unknown; empty and failed reads do not become zero statistics.
- `src/pages/admin/AcquisitionMetrics.tsx`: bilingual channel counts, period controls, loading/empty/error/retry states; horizontally scrollable mobile table. Existing admin role requirement and routes retained.
- `src/pages/admin/AdminIntakeConfigs.tsx`: only KPI grid and number typography changed.
- `src/hooks/useAcquisitionMetrics.test.tsx`: six isolated regressions.
- `AGENTS.md`, `roadmap.md`: source contract and completion record.

## Verification
Source at initial inspection: `43b6711e678b6db5542e14032f726f6c03e76cb1`; automatic source commits are managed by the platform, not created manually.

Command: `bun run test -- src/hooks/useAcquisitionMetrics.test.tsx src/lib/nav/__tests__/adminTaskNavigation.test.ts src/components/admin/__tests__/AdminTools.access.test.tsx` — **19/19 PASS**, rerun after final UI correction.

Command: `python3 /tmp/browser/admin-fixes/check_fixes.py` — **PASS**:
- Real admin session → legacy acquisition link → canonical tab, query preserved → narrow channel GET 200. Actual channel dataset empty for checked 30/7-day periods; truthful empty state, not invented zero counts.
- Period change selects 7 days and rereads backend.
- Legacy Intake link → real settings read → 384×681 mobile: all three numbers one line, no page overflow. Actual counts 23 / 23 / 276; no saves performed.
- Synthetic GET 403 → real page error → Retry → synthetic populated counts 100/15/3/2 and unknown conversion. This populated flow is a fixture, not proof of populated production marketing statistics.
- Guest acquisition deep link → `/auth`; no access grant changes. Existing authenticated non-admin matrix remains outside this task without a specified account.
- Runtime errors: 0. Eleven non-read attempts intercepted on the repeated run; business writes/tracking/notifications blocked. Only GET/HEAD/OPTIONS and existing context/role/currency read RPCs plus token refresh allowed.

Screenshots inspected: `/tmp/browser/admin-fixes/acquisition_desktop.png`, `intake_mobile_kpis.png`, `acquisition_error.png`, `acquisition_mobile_populated.png`. Temporary evidence is not a persistent deliverable.

Automatic build log latest checked entry: `2026-11-13T03:18:00Z — build OK`.

No migrations, function deployments, settings changes, business writes, notifications or publication. No financial metric definitions or permissions changed. Channel population/ingestion was not activated; absent metrics correctly remain unavailable.