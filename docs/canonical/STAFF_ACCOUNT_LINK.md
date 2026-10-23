# Explicit staff directory / company account association

Status: additive source candidate; not applied or deployed. Baseline PR92 `c63b416b6be777b5487bf02bab01d8bddccabcaf`.

`staff_members.id` is a directory record, not an Auth ID. Live read-only catalog inspection confirmed that staff has no account-link column/relation, while `management_company_members.id` already binds one company to an authenticated user. `owner_id` identifies the directory creator. No email/name match or legacy same-UUID coincidence is migrated automatically.

`staff_company_member_links` associates an existing active directory row with an explicitly selected existing active company membership. Composite FKs enforce the same company; primary/unique keys enforce one directory row per membership and vice versa. This relation does not create a person, employment, company membership, role, space grant or module permission.

## Checked commands

- `get_staff_account_setup_checked(p_company_id uuid) -> jsonb`: protected platform admin or active director/admin of that company only; returns active existing member choices and verified active associations with the real Auth ID. No private HR/pay/profile fields beyond member display name/email are returned.
- `set_staff_account_link_checked(p_company_id uuid, p_staff_member_id uuid, p_company_member_id uuid|null) -> jsonb`: the same actor check, company and row locks, existing same-company active directory/membership checks. Null explicitly unlinks; a selected membership explicitly links/relinks. Unique conflict does not move another directory's association. Return confirms directory ID, membership PK and Auth ID (nullable on unlink).

Raw link-table access is revoked from public/anon/authenticated/service_role, with RLS enabled and no permissive policy. Only actor-bound checked APIs are exposed to authenticated callers. Revocation/deactivation, member account replacement and company reassignment invalidate an existing link. Reactivation requires explicit relinking. Unlinking never revokes or grants membership or capabilities. `linked_by` is an actor-bound audit UUID, not a new Auth foreign key; account deletion retains that historical value. The invalidation trigger helper is private-only (`private.invalidate_staff_account_link`) with no public execution grant.

## UI and invitation ownership

Directory creation remains the existing staff writer. Account invitation is a separate explicit user action, owns Auth/company membership only, and returns the persisted company-member ID. It never creates or overwrites a `staff_members` row. Repeated active membership reuse preserves roles/permissions/profile; inactive membership requires a separate reviewed reactivation. Arbitrary supplied roles are rejected.

After an optional invitation, the operator explicitly chooses an account in the link sheet. No automatic email/name mapping is performed. Activity only receives a freshly verified linked Auth ID, never a directory UUID; failed/revoked/stale-company checks do not open the activity consumer. The existing director UI boundary is retained, while backend checks reuse protected company-overseer authority.

The optional invitation path first performs the authenticated read-only `action: capabilities` probe and requires `contract_version: 2` before creating even the directory row. A legacy deployed handler rejects the incomplete invitation payload before any writer; failed/unsupported capability checks preserve the form. This prevents newly deployed UI from invoking the old duplicate-directory invitation writer. Default directory-only entry does not invoke this endpoint.

RPC response rows are validated for nonempty member/directory/account identities, unique membership/user and link keys, and exact member-PK-to-Auth-ID consistency. Malformed/dangling links are errors, not successful unlinked state. Company/actor changes clear local staff forms/dialogs and invalidate pending continuations; stale save/activity results cannot open an old account or display a success message in the new workspace.

## Verification / release boundaries

Disposable PostgreSQL tests apply the actual migration and rollback with synthetic Auth/company/directory records. Actual-entrypoint invitation harness uses synthetic Auth/email SDKs and counts forbidden directory accesses even if exceptions are caught. Component/hook tests use synthetic checked RPCs, forbid direct backend/invitation writes, and distinguish lookup failure from no link.

No live staff/member/data seed, account creation, notification, migration or Edge deployment has been performed. Local invitation harness passes do not certify hosted parity. Full CI and deployment verification remain required. Invitation membership creation/default-permission initialization are existing separate statements: initialization failure may need explicit recovery; this change does not claim a transaction across Auth and Postgres. Existing email HTML escaping is not changed.

Rollback: `docs/hardening/rollback/0037_staff_company_member_link.sql` revokes APIs and raw table access while retaining data and invalidation triggers. Never restore the directory-ID-as-Auth-ID assumption. No financial rule, ledger writer, inventory rule or operating-space enforcement setting changes.
