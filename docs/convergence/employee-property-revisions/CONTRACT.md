# Published property revisions: source proposal

Status: SOURCE-ONLY CANDIDATE, not deployed, no migration journal entry. Depends on the checked employee-publication candidate.

## Audit

- `properties` is the physical asset and public catalogue source. Its draft/rejected states represent initial unpublished content; changing an approved row back to draft would remove the live listing.
- `listing_applications.draft_data` is applicant-owned onboarding intake and may create property/provider/vendor records. Its application identity/status does not model edits to an existing canonical published property. Reusing it would create a second publication authority.
- Generated schema contains no property revision store; `persona_detection_log.proposal` is unrelated. `property_activity_log` already provides append-only workflow evidence, not an editable content source.
- The employee content-author relation and checked safe projection already separate content authoring from owner/provider/manager authority. Preserve them.

## Bounded contract

One nullable `properties.publication_revision` JSONB envelope holds one current proposed patch and review evidence. It is not a second property row, public catalogue, rate plan, inventory, or operational truth. Existing canonical columns remain the only published data. Envelope fields are server-owned: random opaque version UUID, draft/pending/rejected/approved status, submitted/review timestamps, rejection reason, baseline fingerprint, safe baseline content, and an allowlisted patch.

- Read through a dedicated checked RPC with current company + active Space + properties/view + author-or-operational-property authority. No manager assignment or base-table SELECT broadening.
- Save requires properties/edit; changed pricing fields separately require pricing/edit, booking terms bookings/edit. Reuse the existing allowlist/result-row validator. Existing owner/provider/admin writers are unchanged.
- Only approved, active, nondeleted managed properties are eligible. Draft/rejected proposals may be edited. Pending is frozen. A reviewed proposal can start a new proposal; the prior exact proposal and decision remain recorded in the existing audit log.
- Save and submit accept the exact row `updated_at` and proposal UUID read by the editor. The first proposal uses an explicit null proposal UUID. Row locking plus CAS rejects a concurrent editor or substituted proposal.
- Proposed changes never write live content or unset approved/active. Initial proposal captures a SHA-256 fingerprint of the canonical row excluding only the envelope and update timestamp. Later live changes invalidate the proposal; no automatic rebase or overwrite.
- Admin read/review uses a dedicated checked RPC. Approval requires the exact proposal UUID and row timestamp displayed, pending status and matching baseline fingerprint. Under one row lock it applies the allowlisted patch atomically, preserves approved/active and independent ownership/company/provider relations, and records the reviewed envelope. Actor identity is recorded once in the existing activity log, not duplicated in the envelope. Rejection records a reason and leaves all public content intact.
- The review panel shows explicit before/proposed values from the persisted version, never a local unsaved edit or refreshed substituted proposal. A stale version blocks action until deliberate reload. Reject may return a stale proposal for correction; editing a stale proposal must first explicitly discard/restart it against the current live version.
- Direct API writes to the new envelope are blocked for every authenticated client, including existing owner/provider/admin writers. Only checked definer RPCs own the envelope. Existing direct canonical writes remain governed by their existing contracts.
- New audit action names are reserved against direct client forging. Audit failure rolls back mutations. No emails, invites, assignments, permission rows or availability changes.

## UI and acceptance

Reuse the existing property editor form; approved employee edits load the safe baseline plus pending patch. EN/RU/TH copy distinguishes published content from proposal status. Submitted proposals remain read-only. Existing admin properties route hosts the bounded review panel and a pending-proposal queue. Errors never claim a save/review succeeded.

Focused unit/component tests plus isolated PostgreSQL contracts cover public-content preservation; row/proposal/baseline CAS; pricing/bookings separation; unauthorized/cross-Space/withdrawn membership; direct envelope forgery; pending freeze; reason-required rejection; exact atomic approval; failed audit rollback; safe projections; and independent writer continuity. PostgreSQL suite runs only in an ephemeral local cluster or CI, never through hosted SQL.

Activation is NO-GO until independent review, executable isolated tests, production read-only compatibility evidence, approved forward migration and separate controlled activation. This source tranche does not authorize any of those live steps.

## Private-reader boundary and source normalization

The new column contains only draft-field-allowlisted baseline/patch values, opaque versions, status/reason/timestamps and a one-way baseline digest. It contains no author/editor/reviewer IDs, credential values, owner/provider/financial records, or copied full private row. Existing object-authorized base-table readers can read this new proposal column under their unchanged private-row policies; this is explicit, not a claim that the RPC is the exclusive audience. Employee author-only access still goes through the narrower RPC, and all public views must remain explicit allowlists. No SELECT policy or grant is broadened. The existing authorized property-activity audience receives safe proposal snapshots and the existing actor_id evidence; the digest is not copied into log details.

Fingerprint serialization pins UTC. The proposal saver mirrors the existing canonical district-normalization expression before storing the exact review snapshot; post-trigger approval still compares every canonical field and the exact generated envelope. Unexpected production triggers/constraints fail closed and remain a pre-activation compatibility-review gate.

The anonymous boundary is a preflight condition: `has_column_privilege(anon, properties, publication_revision, SELECT)` must be false and `public_view_active` must target only anon. Source `20260617014005...sql` revokes anonymous table-wide SELECT and enumerates safe columns; `0027` removes generic authenticated public-row reads; `0000`/`0026` public views enumerate columns. Synthetic PostgreSQL tests include an approved active row, the real anonymous public-row policy with column-limited grants, successful public title reads, denied anonymous envelope/whole-row reads, empty unrelated authenticated envelope reads and catalogue projection omission. Production read-only evidence for these exact prerequisites remains required; a source file is not proof of applied privileges.

Dated read-only preflight supplied by the parent (19 October 2026) confirms no anonymous table-level SELECT grant on `properties`; SELECT is present for authenticated/service_role. `public_view_active` targets `{anon}`; the misleadingly named “Anyone can view approved properties or own content” currently targets authenticated and requires an exact stored provider→user relation. Other base readers are owner/provider/assigned manager/scoped staff/admin; the existing restrictive private-read Space ceiling remains. These metadata observations support the source boundary but cannot prove privileges on the not-yet-created proposal column; the candidate preflight checks the effective new-column privilege at activation time.

## Verification at source handoff

- Focused wire/static, owner editor, admin revision queue and existing publication static tests: 110 passed across five files. Existing admin sheet regression suite: 12 passed separately.
- Combined publication/revision PostgreSQL suite: 99 cases discovered, all skipped locally because no PostgreSQL binary is installed. CI must execute these cases; the test file fails CI if PostgreSQL is absent. No runtime PostgreSQL success is claimed for the new proposal functions.
- No local full build, whole-repository typecheck, browser launch, live SQL, migration registration, grant changes, deployment, invitations or push performed.
- UI covers EN/RU/TH review controls, exact-version frozen review, duplicate clicks, actor change, unmount, stale errors/reload, rejected/conflicted proposal recovery and initial-publication/independent-owner/provider regression paths.
- Source review fixes addressed: canonical district normalization before persistence, UTC-stable fingerprint, exact envelope and monotonically advanced row timestamp after triggers, explicit unchanged private-row read audience, anonymized envelope and digest-free audit snapshot.

Source implementation may be integrated for review; production activation remains NO-GO until isolated PostgreSQL CI, final typecheck, public-boundary verification and separate reviewed schema activation.
