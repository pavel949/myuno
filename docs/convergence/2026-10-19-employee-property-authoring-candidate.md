# Employee property authoring candidate — source only

This is implementation evidence, not approval to deploy or grant access. No invitations, production data writes, grants, migrations, deployment, or browser production mutations were performed.

## Implemented frontend path

- Secure invite/password continuation reaches the existing employee workspace from verified company membership without requiring a new global staff role or customer/company signup. Safe intended deep links survive login/setup. Auth lookup failure remains an error, not a new account.
- `/mc/properties` retains its operational owner/manager list and adds a separate catalogue-only **Property data entry** section. Its checked list includes the current author's records only. Unavailable API and denied access show an error/retry state; empty never means all properties.
- Creation selects an explicitly assigned active Operating Space through `list_managed_property_authoring_spaces_checked`, including legacy companies. Selection is revalidated immediately before checked creation.
- `create_managed_property_checked` creates one inactive canonical property shell. No frontend owner identity or operational-manager assignment is invented. The explicit draft ID is retained in the URL on partial failure; a retry updates that shell with the captured version. If the shell version is unknown, reload is required.
- Read/save/list use checked catalogue projections, not a broad employee `properties SELECT *`. Save returns the safe canonical row. The authoring route still preserves independently verified owner/provider/platform-admin rights using exact stored identity relationships.
- Managed updates send normalized deltas and compare-and-set versions. Pricing and booking settings are separate delegated actions (`pricing/edit`, `bookings/edit`), not finance access. Disabled defaults are omitted. Removing a media reference does not delete another employee's asset.
- Save draft and submit-for-review are distinct. Pending/approved employee records are read-only. Approved live rows are never silently unpublished or edited as if they were private revisions. Notification failure does not turn a confirmed canonical save into failure.
- Owner identity, agreements, financial reporting and operational credentials are outside the managed catalogue form. Uploaded listing photos/video URLs are public by known URL even while a listing is a draft.

## Backend source dependency and activation gate

This frontend is **NO-GO for claiming an operational end-to-end release** until the separate checked-publication candidate is reviewed, explicitly approved for its security changes, deployed by an authorized operator, and verified:

- `list_managed_property_authoring_spaces_checked(p_company_id)` → `{id,name_en,name_ru}[]` of authorized active Spaces
- `create_managed_property_checked(...)` → inactive shell UUID, explicit content-author provenance, no automatic operational assignment
- `read_managed_property_draft_checked(p_property_id)` → safe catalogue row
- `list_managed_property_drafts_checked(p_company_id,p_limit=50,p_offset=0)` → bounded safe own-authored rows
- `save_managed_property_draft_checked(p_property_id,p_expected_updated_at,p_patch,p_submit=false)` → safe row after atomic draft/review transition
- Backend action checks for changed pricing/booking fields, cross-company project/complex-link checks, publication/review concurrency and employee live-row containment
- Matching object-authorized submission-notification handler

The shared `managedPropertyDraftFields.ts` must remain identical to the backend candidate. The invitation/access candidate adds `pricing` to the existing permission module type. Neither source change grants any user permission automatically.

## Remaining gates

1. Complex authoring is separate: `/mc/complexes` → `ComplexesPage` → `ComplexFormDialog` → `useCreateComplex/useUpdateComplex` currently directly writes `property_complexes` with employee-as-owner creation. It lacks the checked company/Space/content-author/review contract. This candidate does not invent a parallel complex/project hierarchy or claim that workflow is solved. Existing authorized complex linking is checked by the property writer.
2. Post-publication employee changes require a governed revision/approval model. This candidate intentionally leaves those rows read-only; direct operator/owner/provider rights remain independent.
3. Live activation, revoked-access tests, stored data round trips and real invitation acceptance require authorized verification. No live proof is claimed from source tests.
4. Browser execution was denied in this environment. No retry or bypass was attempted; browser scenarios belong in permitted CI. No full local build/typecheck was run because the repository's earlier full validation exceeded the environment memory limit.

## Focused evidence

Vitest coverage includes auth continuation, Thai copy, account switch/unmount/double-submit guards, safe draft projections, missing RPC fail-closed behavior, assigned Space selection, partial shell recovery, pricing/booking deltas, source-field clearing, gallery reference persistence, safe draft list error/empty states, independent provider editing, locked pending/approved rows, and notification-failure independence. Focused ESLint and `git diff --check` are used; lint warnings already present in shared form code are not represented as clean full-repository validation.
