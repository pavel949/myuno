# Property review queue and admin publication UI

## Scope and canonical contract

Base: `dec344de5` (PR #122 merged). This tranche preserves the current `properties` domain, existing RLS-protected admin writers and public projection. No migrations, privilege changes, production business writes, or deployment are included.

The earlier property/project review filter candidate (`d6201f644`, `0bebe2f99`, `39cb6623a`) was preserved and reapplied on this base. The uncommitted moderation candidate in `myuno-moderation-queue-review` was copied without altering its original worktree, then revised below.

- Pending moderation means `approval_status = pending` for properties and listings. An employee-created property does not need an owner_id to appear in the same admin queue. Inactive services/products remain a separate catalogue view; inactivity does not invent pending approval.
- Public property discovery still requires approved, active and not deleted. Approval and activity remain separate fields. Admin creation respects an explicitly inactive draft, and the admin form exposes the existing draft status.
- This does not establish an immutable revision workflow or force published employee edits through review. Current direct editor/backend behavior and the separately proposed checked publication RPC need their own governed acceptance; the UI does not substitute for database authorization.

## Implementation

- Exact queue/dashboard counts share one pending predicate. Failed/missing counts remain unknown; partially available rows and bounded-list limits are disclosed. Loading, read error/retry, true empty and filtered absence are distinct.
- Bilingual names, provider, type and category filters are URL state. Property Review opens the exact implemented admin editor and carries an allowlisted return route. Save/dismiss returns to the same filtered moderation queue. Catalogue-only links are labelled as catalogue links, not nonexistent item editors.
- Queue approval/rejection keeps the existing writer payload, adds pending-state compare-and-set, and requires a matching returned id/status/activity. Property actions also compare the reviewed `updated_at`; a missing or stale revision fails without a success message. Repeated and conflicting clicks are suppressed while pending. Buttons state that approval also activates.
- Admin property form saves also compare the originally opened `updated_at` and verify returned moderation/activity fields. A background list refresh does not silently replace the reviewed revision under an unsaved form. Unconfirmed writes preserve the editor and explain how to reload before retrying.
- Editor save refreshes moderation/dashboard counts. Queue/dashboard query keys are actor-bound. These are UI/cache protections, not a replacement for server authorization.
- Missing property deep links show an actionable unavailable state. Dismissal clears edit state without reopening on a delayed route commit; browser Back/Forward changes are observed.

## Verification

All local checks use synthetic data with outbound application network denied. Full build/typecheck and browser launch were deliberately not run locally because of the task's resource/access limits.

Final local evidence: 96 focused tests passed across nine files; changed-source/test ESLint reports 0 errors and 15 legacy warnings. New controls and review states have EN/RU/TH unit coverage. All three fixture bundles compile, JavaScript syntax checks and Python AST checks pass, and `git diff --check` is clean. Compilable fixtures:

- `scripts/qa/admin-review-queues.mjs --bundle-only`
- `scripts/qa/moderation-queue-ui.mjs --bundle-only`
- `scripts/qa/property-editor-ui.mjs --bundle-only`

The connected-system CI workflow now runs both added queue fixtures in addition to the existing full editor fixture, covering RU/EN/TH and 375/390/430px plus desktop with network-denying synthetic boundaries. CI execution and visual review are still required before claiming browser acceptance.

## Rollback / limits

Revert this frontend tranche to remove the changed presentation/CAS behavior. No database rollback is needed. Do not remove existing database policy guards. Local unit tests and bundles are not evidence of production roles, deployed policy grants, or a completed real employee→publication journey.


## Follow-up: soft-deleted properties

`src/pages/owner/OwnerProperties.tsx` moves properties to trash by setting `deleted_at`/`deleted_by` and `is_active=false`, without changing approval status. The property soft-delete columns are established by `supabase/migrations/20260302073213_0f1176e6-698d-452b-a445-83399adc73c3.sql`. The canonical public projection in `drizzle/migrations/0026_public_catalog_projection_extension.sql` explicitly requires `deleted_at IS NULL`.

The review queue, matching pending dashboard count and admin property review list now apply that same non-deleted predicate. Queue approval/rejection and admin editor saves additionally require the property still be non-deleted at mutation time, alongside their existing revision/pending-state guards. Moving a property to trash after its editor/queue loads cannot produce a successful approval through these UI paths. Listings/services/products are unchanged; activating a service or product remains an `is_active` update, not service approval workflow acceptance.

Follow-up verification: 55 focused tests passed in four files, including explicit property-only non-deleted read/count/write predicates and a deletion-after-load failure case. Changed-file ESLint and `git diff --check` passed. No migration or production mutation was performed.

## Follow-up: CI TypeScript inference

PR #124's four TS2589 errors were reproduced with a file-scoped TypeScript check. They originated at the listing/property `pendingModeration` calls: inferring a generic return type by structurally matching the full recursive Supabase query builder exceeded TypeScript's instantiation depth.

The shared predicate now accepts a callback typed to exactly `approval_status` and `pending`. Supabase still infers each actual select projection and response; no cast, `any`, suppression, schema relaxation or error/count behavior change was introduced. The queue and dashboard keep the same filters, selected columns, limits and exact counts. Tests assert every queue projection and the helper's precise return type.

Verification: the scoped TypeScript check for `adminModeration.ts`, `useAdminDashboardStats.ts`, `adminModeration.test.tsx` and their dependencies passes; 47 focused moderation/dashboard tests pass; changed-file ESLint and `git diff --check` pass. Full repository typecheck remains a CI gate rather than a local resource-heavy run.
