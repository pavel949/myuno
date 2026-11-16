# myuno production readiness — remaining work, 2026-11-16

Target: `pavel949/myuno`, Lovable project `dcc2b024-7627-4ad9-a915-a3df3dd839f0`, database `kakkwibljrjsawxgnupk`. Decision remains **NO-GO for live financial activation**. The owner requested automatic continuation and previously approved the dependency changes, manual receipt rules and Ignatev Estate Co., LTD as recipient for all 24 active properties including Show Property Phuket. Those decisions do not need to be requested again.

## Verified remote checks for parent 742fb34

- `verify` run 43709493988: success. Node 22 typecheck, complete unit/PostgreSQL suite, advisory gate and lint passed.
- Semantic validation and cleanup checks: success.
- Connected-system run 43709494080 and design-system run 43709494032: failure. Local 5070-test evidence never established that these broader browser gates passed. Legacy hosted-mutation e2e remains deliberately skipped; it must not be enabled against the shared production backend.

CI logs and downloaded evidence identified stale fixtures plus small real responsive defects. This follow-up updates exact canonical owner/catalogue destinations, the governed contact number, the 63-route admin navigation contract, four homepage rails/four failed catalogue readers, the Discover entry, and the explicit vendor-services read stub. Provider-filter and loading locators now identify their actual controls; empty provider results retain filters and are checked for recovery when search changes. The complex-card check distinguishes the accessible card container from its actual title link, then verifies real navigation.

Product corrections: allow the concierge action to wrap within a narrow viewport; allow English/Thai bottom-bar labels to wrap while retaining the compact Russian label; apply the existing 16px rail glyph contract to the experience rail as well. No payment, price, authorization, inventory or database contract changes are included in this follow-up.

## Current follow-up evidence

- 25 affected component/integration tests pass; 13 UI-evidence validator checks pass.
- Homepage: 27 passing browser scenarios across EN/RU/TH and 320–1920px, including genuine loading/error/empty states.
- Complex: 12 passing browser scenarios, including canonical unit navigation and rental/sale mode changes.
- Workspace page frames: 56/56 pass, synthetic reads and no writes.
- Complete services matrix: 40/40 pass, including genuine loading/error/empty states, provider filtering and recovery, and canonical navigation. Focused provider layer: 2/2 pass.
- Typecheck, focused lint and production build pass. The parent full-suite result is historical; CI repeats the complete suite for this follow-up.
- Full connected/design matrices retain their remote-CI-only execution contract. Their new run is required; a fixture correction or successful local subset is not recorded as a green remote gate.

## Remaining tasks, in order

| Task | Current state | Completion evidence |
|---|---|---|
| Finish all CI gates on the corrected candidate | Corrections prepared; remote rerun required | Successful verify, connected-system and design-system results for the exact candidate |
| Create a full current database export and preserve Storage separately | Blocked by unavailable Lovable dashboard/export access in this session | Downloaded archive with schema/data/Auth, separate files and verified hashes kept outside public Git/artifacts |
| Demonstrate isolated recovery and full-schema migration compatibility | Not performed; synthetic PostgreSQL contracts already pass | Restored isolated target with outbound jobs/messages disabled, checked auth/data/files and migration/rollback acceptance |
| Reconcile historical financial and inventory state | Source/live read-only evidence exists; external provider history remains unverified | Reviewed earlier THB sessions, receipts, inventory links and ledger discrepancies; no guessed paid markers/refunds |
| Activate the prepared database/recipient/Edge/frontend package | Not applied | Reviewed predecessor parity, three source migrations, all 24 exact recipient bindings, matching handler/frontend versions, private proof storage constraints and post-activation evidence |
| Verify duties, operational isolation and the full booking flow | Existing team/Space assignments are not invented | Real administrator/delegate and property/Space manifest; appropriate access isolation; quote→inventory→verified payment→operations→ledger acceptance and delivery/monitoring evidence |

Refunds, overpayment allocation and automatic secondary Stripe installments remain contained. They require separate checked workflows if needed for the release scope; they must not be enabled through direct status edits.

## Backup automation access limitation

The available Lovable tools expose project/database reads and SQL, but no native export, backup-management or restore operation. No authenticated Lovable dashboard browser/control tool or running signed-in browser session is available here. Installing Chromium or writing a public-table snapshot does not supply that access or create a complete recovery archive. No export is claimed to have started.

Official procedure checked on 2026-11-16: https://docs.lovable.dev/features/database-backups . Native daily restores replace the same production database. The export is requested through More → Database → Manage → Settings → Export project data, and downloaded from Storage. It includes database users but excludes Storage files, Edge code, secrets and sign-in settings. The existing row snapshot does not replace it. Never test recovery by clicking Restore on the production project.

Continue automatically where tools/data allow. The access required to initiate/download the native export remains the external blocker; no password or key should be pasted into chat. The financial activation order and restrictive rollback remain in `docs/hardening/production-readiness/RELEASE.md`.
