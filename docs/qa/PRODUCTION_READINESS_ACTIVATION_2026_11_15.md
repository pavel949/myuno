# myuno — dependency and activation follow-up, 2026-11-15

Status: implemented in source; **NO-GO for production financial activation** until recovery and runtime acceptance. This follows commit `08a7da3f62147acece35662889d93603155c14dd` and updates draft PR #208. It targets React/Vite `pavel949/myuno`, Lovable `dcc2b024-7627-4ad9-a915-a3df3dd839f0`, database `kakkwibljrjsawxgnupk`.

## Approved scope and implementation

The owner explicitly approved Router 6→7 and the necessary major dependency updates, and confirmed **Ignatev Estate Co., LTD receives payment for all 24 active properties, including Show Property Phuket**. Existing manual-RUB rules remain: admin or explicitly appointed delegate, actual receipts and agreed documented FX, partial debt retained, separate decisions for overpayment/refund.

Router 7.18.5, glob 14.0.6, minimatch 11.0.8 and compiler upgrades are implemented with compatibility corrections. Vite 6 uses its supported esbuild 0.25.12; other tools use 0.28.2. JSX accessibility lint retains its supported minimatch 3 API. Native brace-expansion versions replace the incompatible global override. npm/package-lock is authoritative; stale Bun lock and redundant resolutions were removed. CI installs reproducibly and adds the advisory/reachability and actual XLSX export gates.

The provider query-command dialog now consumes each actor/history command once before urgent form updates. The existing admin/read gates remain authoritative. Legacy property redirects retain query/hash/state and show bounded content loading during deferred navigation. Tests now reflect Router 7 transitions; the navigation fixture supplies a real destination and verifies arrival instead of leaving an unhandled rejected navigation.

Three new migrations were generated through the official Supabase CLI and tested as actual source files. Financial writers/inventory/authority share one transaction; consultation intake is separate; direct browser mutation of trusted provider→org bindings is revoked. Read-only live evidence found generic staff could pass the old binding mutation policy. A restrictive rollback contains writers and keeps evidence and recipient protection.

The privileged recipient configuration requires the exact approved 24-ID manifest, checks the existing real provider, creates/reuses the legal organization, rejects conflicts and rolls back if catalogue visibility changes. It preserves management companies, owners, publication state and commercial history. The concrete manifest is outside Git with mode 0600; its SHA256 is `67e66ffbed7e61d238ade9f1fdf23928961f2fa701a8b6a62a12bfc5e51f421d`. Neither test organization is repurposed.

## Evidence

All business verification uses synthetic data and local PostgreSQL/socket or browser fixtures; hosted backend calls are forbidden by the local network guard. Read-only live queries are recorded in `activation-preflight-2026-11-15.json`. No production mutation, migration application, Edge deployment, charge/refund, role assignment or message dispatch occurred.

| Check | Result |
|---|---|
| Full isolated suite after final compatibility correction | 5070/5070 pass, 443/443 files, zero skips or unhandled errors, 547.39 seconds |
| Financial contracts executing registered source migrations | 72/72 pass |
| Privileged recipient configuration and rollback/conflicts | 9/9 pass |
| Actual Router/provider/redirect browser matrix | 16/16 pass: RU/EN × 375/390/430/1280px × 2 scenarios |
| Handler, snapshot and actual XLSX roundtrip | 20/20 pass |
| Advisory gate negative/consumer-change checks | 4/4 pass |
| Signed operator ingress/terminal-state cases | 19/19 pass |
| Transfer conflict checks | 5/5 pass |
| Typecheck | pass |
| ESLint | pass, zero errors; 2214 existing warnings |
| Production build | pass, 7184 modules, 116 seconds |
| npm production audit | zero vulnerabilities |
| Complete npm audit | four reviewed low build-only nodes; zero moderate/high/critical |

The earlier complete run passed all 5070 assertions but reported one unhandled navigation error in the Discover test fixture. It is not counted as a clean acceptance run. The fixture correction adds its actual destination and awaits arrival; its eight focused tests pass. Earlier Router dialog/loading and brace API failures were corrected before the final verification; failures were not suppressed.

The remaining deepmerge advisory has no patched upstream release. Reviewed pinned node-resolve ESM/CJS consumers merge only module-local defaults; options are shallow-spread afterward. The affected chain is build-only. This is a reachability assessment, **not a patched-library claim**. The gate rejects new/elevated advisories, incomplete reports or changed consumer hashes. See `docs/security/dependency-audit-policy.json`.

Local Node 24.22.1/npm 11.9.0 results do not establish Node 22 GitHub CI status. Build credentials were loopback verification placeholders, so local artifacts are not deployment artifacts. Auth/scope coverage uses the complete existing isolated suite; no real customer account or hosted financial transaction was used.

## Remaining release gate

Follow `docs/hardening/production-readiness/RELEASE.md`. Full database schema/data, Auth and Storage backup access and a demonstrated isolated restore remain unavailable. A public-table row snapshot is insufficient. The source migration files and recipient transaction are **not applied**. Refresh predecessor hashes and exact scope, test against the restored complete schema, reconcile external provider history, and coordinate matching Edge/frontend/database versions before enabling payments. Existing role/Operating Space duties require verified assignments through existing checked processes. Refunds, overpayment allocation and automatic secondary Stripe installments remain contained as documented.

The earlier report and manifest describe the original parent candidate. This document and `activation-source-manifest.json` describe the follow-up; historical test evidence is not relabelled as proof of the current tree.
