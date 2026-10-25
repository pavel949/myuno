# Owner intake reconciliation — local UI tranche

Base `117b892e294a4fbcb02570b34ee9b72d7bc5d1b5`; separate branch `codex/ds-owner-intake-reconcile-20261025`. Saved WIP and remote `codex/owner-intake-20261025` were read-only inspected at `0fb39b76297e450042cb63385b81e994edbfa1f5`. No old branch rewrite/merge, workflow adoption, shared CSS or SectionHeader changes.

Compatible WIP adopted: separate owner section in the existing home intention sheet, preserving the four guest destinations; rent-out/management intents route to the current owner landing. Management marketing describes review of property/expectations/current situation and an individual proposal if suitable. Fixed 70/30, 30% and 85% occupancy promises were removed only from owner management marketing. Existing self-service prices and financial/operational contracts are unchanged.

The existing LandingLeadForm/useUniversalLead consultation path remains. Optional owner context records `vertical_metadata.owner_intent` plus readable notes and the owner entry-point query; request_type stays `full_management`. No new pipeline/schema/writer. Contact fields freeze only for this owner context while pending. Local intent controls use existing RadioGroup/Label, with compact indicators inside full 44px labels.

Initial query/history changes update the selected goal without erasing contact/message state. Once attempted, an unconfirmed request keeps its original intent even if the route query changes; manual retry therefore uses the displayed old context. A deliberate radio change after failure resets that lock and begins a different logical UI attempt while retaining contact values. Pending/receipt controls stay locked; an ID-bearing fixture receipt is required for the form's saved state. Synchronous duplicate-event guard is local-flight protection, not response-loss deduplication.

## Receipt/idempotency source gate

`src/hooks/useUniversalLead.ts:85–93` submits the existing `submit_consultation_request` RPC and validates a nonempty returned ID. `src/hooks/useConsultationRequests.ts:192–213` treats that ID as committed-create receipt and preserves it if optional private readback fails.

Latest function definition found in repository: `supabase/migrations/20260820013124_872c9134-4d43-4d0d-bfd5-ef6a97799dbd.sql`: allocates gen_random_uuid per call, strips caller id, inserts then returns the new ID. No supported stable operation/replay identity was found in this function or the two caller inputs. A response lost after commit can therefore be followed by a duplicate on an explicit retry under this source contract. No frontend disabled button, stable payload, fake receipt or submitted-state flag proves deduplication. Resolving that backend contract is a separate reviewed gate; no migration or hook change is included here. Source does not prove this function's deployed state or live delivery.

## Evidence boundary

Targeted suites cover the four guest routes, two owner destinations, contact/history survival, pending query change + failed response + explicit retry with equal payload, deliberately new intent after failure, receipt-only saved state, and management copy. Browser fixtures use actual HomeSearchEntry/OwnerManagementLanding/LandingLeadForm/ForOwners/FullManagement, actual app CSS and pinned Python Playwright. Actor/read/write/shell/preferences adapters are synthetic; production backend module is excluded and every non-fixture browser request is denied. No real submission, email or management activation occurred. Synthetic retry equality does not establish server idempotency.

Dependency source is `/workspace/myuno-ready-dependencies/node_modules`, linked only after package-lock byte equality with current global and this worktree; installed react-day-picker 9.14.0. Bun lock differs from that dependency worktree and was not used.

Remaining gates: root integration/CI, authentic delivery/notification observation under separate authorization, server replay contract, and production/physical-device acceptance. Local only; no push/PR/merge/deploy.
