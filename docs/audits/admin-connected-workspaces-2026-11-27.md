# Connected platform-admin workspaces

Source baseline: `872d4ef9f704dc8a3c7c9c5ec192de299f772112`.
Branch: `codex/admin-live-dashboard`.

## Implemented source behavior

The existing Today dashboard and shared token-driven shell are retained. Its attention list
reads existing support, manual-payment-review and open-dispute queues. Each
source contributes at most five records; this is a preview, not a total task
count. Support assignment filters execute before the limit. Support SLA and payment-request deadlines are distinct. Missing assignee names do not imply unassigned.
Independent source failures are disclosed, and missing data never becomes zero.

Exact-record handoffs use existing domain screens:

| Record | Destination |
| --- | --- |
| Support ticket | `/admin/tickets/:ticketId` |
| Manual payment request | `/admin/operations?tab=manual-payments&request_id=:id` |
| Commercial order | `/admin/operations?tab=bookings&order_id=:id` |
| Dispute | `/admin/disputes?dispute_id=:id` |

Order and payment detail reads do not depend on the current list page. They
preserve queue filters on dismissal and distinguish read errors, inaccessible
records and malformed links. Reading a record never submits a decision. Actor
changes unmount order/payment workspaces; their private detail caches are actor
bound. Support detail/conversation and dispute reads are actor bound as well.

Command search uses the actual navigation model and existing creation URLs.
An active administrator defaults to Today unless an explicit permitted workspace
was saved. Prospect actions open the existing `VendorProspectDetail` workflow.
Taxonomy Add now submits through the existing definitions mutation, preserves
input after failure and opens the existing values editor after success.

Marketing tabs preserve their parent workspace, URL/history and return context.
Landing and user handoff IDs persist in the URL. Legacy landing configuration
continues to use its existing registry; this change does not migrate that source
to the newer landing builder. An absent campaign-rules destination is no longer
presented as an interactive state card.

Marketing event diagnostics use exact counts, explicit periods and landing
selection. Event payloads and unverified booking totals do not establish revenue,
unique users or financial ratios. Channel reporting reuses `AcquisitionMetrics`
and recorded `mcc_channel_metrics`; finance links retain the existing finance
workspace. CSV exports the loaded event evidence through the shared formula-safe csvCell encoder. The AI quality report is named
for the records it actually reads, exposes read failures and offers browser print
and the real catalogue destination instead of inert PDF/analysis buttons.

## Verification and release limits

All UI tests use synthetic fixtures; no production business records were created
or changed for QA. No migration, edge deployment, RLS policy, financial writer or
inventory writer is part of this patch. Existing domain mutations remain the
authority and have not been exercised against production.

The initial broad admin run had 311 passing tests and 15 timeouts while a full
compiler process competed for the executor. All affected files were subsequently
rerun without that compiler load. Focused tests additionally cover exact-record
handoffs, actor admission, source failures, taxonomy submission and marketing URL
navigation. Final command outcomes are recorded with the change review.

Design-system audit: zero new or structural findings (pre-existing baseline
findings remain). Changed TypeScript/TSX lint: no errors; warnings remain in
existing code and test fixtures.

`node scripts/qa/admin-case-layout.mjs` passed 24 browser scenarios for the actual
case-list and AI-report components in RU/EN/TH at 375, 390, 430 and 1440 pixels.
External requests were blocked. Checks cover overflow, 44px controls, expansion,
assignment filtering, refresh, failures, empty/partial data, print and catalogue
navigation. Synthetic fixtures are test infrastructure, never operational data.

The last focused verification passed 21 tests across support detail/actor reads,
canonical prospect stages, marketing detail navigation and AI record semantics.
A subsequent catalogue run passed 8 tests across unified records, workspace
navigation and existing domain links. Earlier exact-record, command palette,
taxonomy, home, dashboard and order regression suites also passed. App TypeScript
and changed-file ESLint passed before the final production build. Build and CI
outcomes must be checked on the reviewed source SHA; no deployment is implied.

Additional repairs preserve the existing unified catalogue workbench/provider
selection while replacing legacy self-looping cards with canonical domain-editor
links. Prospect filters use the existing CRM stage definitions (including won),
and unknown legacy stages stay unknown. Changing support records resets local
resolution drafts. Manual landing/user navigation persists valid context in URL
history. AI acknowledgement share is labelled as a recorded admin decision ratio,
not model accuracy; analysis rows are not claimed to be unique listings.

Production publication is not certified by source tests. No live financial or
inventory transaction was performed. A visual rollback uses a forward UI patch. Preserve actor-bound cache keys,
admin admission, safe failure masking and truthful metric labels while restoring
prior presentation. Regenerate source inventories for the resulting source;
no production-record rollback is needed.
An unrelated working-copy change to supabase/functions/mcp/index.ts is excluded.

Earlier local production build: npm run build exited 0 (7,237 modules; Vite and PWA generation complete). Prebuild design audit: zero new/structural findings. Shared CSV safety tests: 2 passed. This identifies a local source check, not a production deployment. CI on the PR head remains a separate gate.

The complete dashboard integration also checks real pointer hits. The nested
decision card sizes to its content; cases and decision summaries share their
area, and work queues occupy their own row. This prevents the queue links from
being covered by adjacent status/revenue panels. Local Edge verification passed
18/18 combinations (RU/EN/TH at 320, 375, 768, 1280, 1920 and 2560px), checking
vertical containment and ordinary provider-queue link clicks without force.
The existing 60-case browser matrix now asserts containment of decision/queue
children as a permanent regression check.

Both dashboard fixture bundles replace case reads with synthetic QueryClient
responses and continue to reject production transports. Home smoke expectations
use /admin for an administrator's default while retaining explicit saved /mc,
invalid-preference and actor/role-change checks. No browser time budget was
increased and no gate was skipped to accommodate the layout defect.

Final local production build after the queue-layout correction: npm run build exited 0; 7,237 modules; Vite build 4m13s and PWA generation complete. Font, service-tag and design prebuild checks passed (zero new/structural design findings). The final committed head still requires the full CI release gates.


Merge validation base: af134ed46117c3dc6899ba37d36e636cb9417217. Creation uses its shared TaxonomyCreateDialog; no parallel inline creator is retained. Six focused merged-source suites passed 119 tests, including navigation, command destinations, Today, shared creator behavior and host integration. Full npm run typecheck passed on the merged source. Final committed-head CI remains a release gate.


Merged-source production build completed successfully: 7,242 modules, Vite 8m36s, PWA generated (79 precache entries). The merged build uses isolated configuration and is not a deploy artifact. Edge pointer/vertical-containment verification on this build passed all 18 language/viewport combinations. Full committed-head CI is still required before release.
