# Operating spaces — minimal implementation design

2026-10-17 · Tranche 2E · **PROPOSED, not implemented or migration-approved**.
Evidence: [current gap audit](../convergence/OPERATING_SPACES_GAP_AUDIT.md).
Follows [connected blueprint](MYUNO_CONNECTED_PRODUCT_BLUEPRINT.md).

## 1. Contract and smallest additive model

```text
Property:   Project → optional category → physical property/unit
Operations: Management company → operating space → property assignments + members
```

Space is a scope, not a tenant/counterparty/project or another source of booking,
task, CRM, price, inventory, finance, ledger or auth truth. Active company stays
above it. No Layantara name/slug/role branches, new shell or top-level route.

Recommended initial model: **three new public tables**, no capability JSON,
no new role enum, no cloned domain records. Column names below are proposed
contracts, not executable DDL. Revalidate live schema before any migration.

| Table | Minimum proposed fields | Constraints / responsibility |
|---|---|---|
| `operating_spaces` | `id`, `management_company_id`, `name_en`, `name_ru`, stable `key`, `is_active`, timestamps | FK existing company; unique `(management_company_id,key)`; composite identity `(id,management_company_id)` available for tenant-safe joins. Optional descriptive `type` only if a real consumer needs it; omit arbitrary config JSON in MVP. |
| `operating_space_properties` | `space_id`, `property_id`, `management_company_id`, `assigned_at`, `assigned_by` | One **current primary** assignment per property: unique `property_id`, not unconstrained many-to-many. Company context is integrity metadata, not duplicate property truth. Composite same-company FKs or checked constraint-trigger contract on both property and space changes. |
| `operating_space_members` | `space_id`, `company_member_id`, `management_company_id`, `is_active`, `granted_at`, `granted_by` | Unique `(space_id,company_member_id)`; membership references existing UUID PK, with composite same-company validation. Active member AND active company membership AND active space required at authorization time. No new account/auth-users FK. |

`assigned_by`/`granted_by` are plain actor UUIDs or existing public profile
references, server-derived, not auth-schema modifications. Initial assignment
audit uses existing audit infrastructure only after verifying its contract;
never invent an authoritative assignment-history table silently. If historical
finance attribution requires effective-dated assignments, design it in E5,
not by using mutable current assignment as an accounting fact.

### Why company-member reference, not another user membership model?

Live `management_company_members` has a stable UUID PK and unique company/user.
Space employment/access is explicitly nested beneath this active company
membership. **Recommend `company_member_id`**, resolving `user_id` through it;
this avoids a second independent company employment registry and fails closed
on deactivation/deletion. Composite FK support requires an additive unique
`(id,company_id)` on the parent or an equivalent validated trigger.

Direct `user_id` would be workable only with identical active same-company
checks, but permits easier dangling grants after removal/rejoin. Do not include
both as competing authorities. Deleting/recreating membership must not recreate
space grants automatically. Reactivation of a retained membership requires
explicit review of still-active grants; a revoked space grant stays revoked.
Directory `staff_members.owner_id` cannot substitute for this account reference.
Workers without a login remain directory records, not authorized space users.

### One primary space; cross-team access via member grants

One operational lead per physical property avoids ambiguous turnover ownership
and double-counted portfolio totals. A resort parent and all managed children
must be covered by an approved same-company assignment set; a category is not
a physical unit and is not assigned separately as invented stock. Global project
catalog remains unchanged. Reject orphan parent/child assignments at cutover;
do not automatically infer membership from project association.

Cross-space work is explicit membership in the other space, optionally combined
with existing staff property assignments. No demonstrated requirement for one
property in multiple operational portfolios; defer many-to-many operational
ownership. Property reassignment is one authorized transaction with tenant
checks, audit, context revision and post-commit cache invalidation. Changing a
property's company while assigned must fail or explicitly clear/reassign it in
the same controlled operation, never leave a cross-company link.

## 2. Security and existing RBAC reuse

Use the **existing company module/action RBAC as a ceiling**, not copied JSON:
`team_member_permissions` and live `mc_can_access` vocabulary
`view/edit/export`; existing `sub_permissions` only where already defined and
enforced. Space membership grants scope, not a finance/export/HR permission.
Do not copy module grants into the three new tables.

Proposed operational check, not a deployed function:

```text
allowed(actor, property, module, action) =
  verified platform oversight
  OR (active company director/admin for property's company)
  OR (active same-company membership
      AND existing company module/action capability
      AND active membership in property's active primary space
      AND required property-specific restriction)
```

- Manager/accountant no longer gain company-wide operational access merely
  from title on an enforced company; they need space membership and module
  action. This is an intentional future permission change requiring approval.
- Staff additionally need existing active property assignment where current
  policy requires it. Space membership does not widen staff duties by default.
- Company director/admin see all company spaces; platform admin oversight is
  verified protected `user_roles` authority, never profile/storage/name/email.
  Broader existing uno_team bypass must be explicitly reviewed, not expanded.
- Personal ownership/delegation, guests, customers and public marketing are
  separate contexts, retained with verified rights. A public listing does not
  grant PMS access; an org counterparty grant must not bypass space-limited
  employee restrictions on private operational order data.
- Same membership capability applies in each explicitly joined space in MVP.
  If finance-in-one-space but operations-only-in-another is required, MVP is
  insufficient: add **normalized scoped grants using the same module/action
  catalog** in a reviewed later design. Do not put unvalidated JSON roles here.
- Propertyless CRM/company finance/HR records have no inferred space. Require
  appropriate company-level authority or verified existing record ACL; suppress
  them from scoped aggregates rather than assigning them by contact name.

### Enforcing means closing sibling/bypass paths

Three table RLS policies are necessary but insufficient. Before enforcement,
enumerate and test **every** broad existing permissive path on properties,
bookings, orders/items/participants, tasks/service requests, rate/category tools,
financials/accounts/ledger, CRM/owner relationships, staff/shifts, views/storage,
exports/reports and SECURITY DEFINER/edge boundaries. Use private projections
where public base-row access otherwise exposes protected columns. Preserve
public catalog and customer/owner rights without equating them to staff rights.

New tables: explicit GRANTs after CREATE, then RLS and policies, service authority
only where needed; no anon grants for private spaces/members. Member self-read
does not allow self-grant. Checked grant/reassignment/context operations derive
actor from `auth.uid()`, enforce same company and validate capabilities.
Service-role code must validate caller scope before bypassing RLS. Keep all
money movement, booking statuses and inventory/date constraints unchanged.

## 3. Nested context and default behavior

Future resolver is explicit company + optional space + authorized property IDs
with an authorization revision. Reuse/extend existing context resolver rather
than independent local permissions. Local storage remembers preference only.
Do not persist selected space as `user_active_context.entity_id` in place of
company; its current meaning is mode entity/company.

| Situation | Contract |
|---|---|
| No space selected, authorized company oversight | All **authorized active-company** spaces plus explicit unassigned bucket; not all platform companies. |
| Ordinary member with saved authorized preference | Default to that space; revalidate every resolution. |
| One authorized space | Default there. |
| Several spaces, no valid preference | Union of user's authorized spaces, clearly distinguished from company All; never broaden to unjoined spaces. |
| Enforced company, no grants | Explicit access-required state; no company fallback, no zeros presented as complete operations. |
| Company not cut over | Existing legacy company behavior, explicitly marked as not two-team-isolated; old owner context preserved. |
| Invalid/inactive/deleted requested space | Deny requested scope and clear preference; re-resolve authorized default, never accept raw requested ID. |
| Company switch/logout/revocation | Clear space and selected property/booking/bulk selections; cancel in-flight work, evict restricted caches, re-resolve. Late old response must not populate new view. |
| ID deep-link outside space | Server authority rejects inaccessible object even if cached or guessed; cross-granted users may switch to an authorized destination explicitly. |

Never treat `[]` as “filter omitted”: empty authorized scope yields no query /
denial, not `.in(...)` removal. Failed resolver/property source is an error, not
zero availability or all-clear. Scope keys include actor, company, space/default
mode, property IDs or stable scope revision. Client cache is not authorization.

## 4. Controlled rollout (future approval required)

Feature **presentation** flag and **server authorization cutover** are different.
Disabling UI must not widen enforced permissions. Shared production is live in
preview/drafts too; local isolated schema/RLS fixtures are the first gate.

| Tranche | Minimal change / Definition of Done | Rollback |
|---|---|---|
| E1 schema + RLS + reviewed seed/backfill | Three additive tables, constraints/indexes, private grants/RLS, local isolation tests, reviewed manifest, counts and rollback. Start shadow/unconsumed; no global runtime authorization switch. | Disable new consumers first; preserve audit/manifest; reverse only new assignments/seed rows by recorded IDs. Executable rollback in `docs/hardening/rollback/` tested locally. Do not drop canonical records. |
| E2 context/scope resolver + tests | Server active-company/member/space verification; explicit All/user-union/legacy rules; scoped cache contract, switch/revocation/race tests. Verify every bypass identified before enabling enforcement. | Roll back context UI while keeping authorization fail-closed. Retain schema and grants; do not resume broad legacy access automatically. |
| E3 Properties/Calendar/Today/Bookings | Optional authorized ID intersections through all list/detail/export readers, cleared selections; grouped vs single parity; existing UI/date/inventory tests green. Update necessary operational RLS/checked access as coordinated security cutover, not only filters. | Previous compatible UI may read enforced authorized subset; disable feature views if incompatible, not security. Restore policy definitions only via approved security rollback and access-impact review. |
| E4 Operations/Staff | Cover distinct operational/CRM task and request sources; authenticated employee mapping, existing property duties, shifts and private HR fields; preserve writers/transitions/confirmations. | Retain enforced membership/assignment boundary; disable new selectors; reversible scoped query/policy changes under security review. |
| E5 Finance/P&L | Finance/export capability enforcement, all privileged report/export paths checked; currency conservation, reconciled ledger attribution, unallocated/shared cost handling, effective-date policy. No claim of P&L from gross booking totals. | Keep canonical money/ledger unchanged; disable scoped P&L publication, retain historical attribution/audit; reverse reporting layer only. |
| E6 Dashboard/Founder consolidated view | Existing dashboard branches consume declared scope; founder All equals disjoint spaces + unassigned without double count; personal/global branches remain labelled separately. RU/EN safe QA and authenticated read-back. | Disable consolidated view, keep authorized underlying scopes and original shell. |

**Security gating across sequence:** E3–E4 may be demoed with synthetic data
before cutover, but may not be advertised as isolation while finance/CRM/export
bypasses remain reachable. Either close all relevant broad paths at cutover or
explicitly deny unsupported modules/exports to space-limited employees until
their tranche. No migration-generated role elevation to make pages work.

### Data-only initial spaces, not executed here

1. Founder reviews the existing company ID and an external manifest of physical
   property IDs, resort parent/category links and authenticated company-member
   IDs. Resolve any of the 39 missing/unlinked villa records in separately
   authorized inventory onboarding, not by fabricating 39 seed properties.
2. Create two data rows with stable company-local keys and bilingual labels:
   **Layantara** and **Condominiums**. Generic code works for any labels/keys.
3. Assign reviewed Layantara parent/physical units to the first; reviewed condos
   spanning verified projects to the second. No name LIKE backfill, no automatic
   “all non-Layantara” assignment, no owner-ID guessing. Unmapped records stay
   unassigned for director review, not visible to ordinary employees.
4. Grant reviewed resort/Condo members; preserve existing staff property duty
   links, explicit cross-space grants and founder/company director authority.
   No email match or staff creator ID used as authorization.
5. Transactional dry-run manifest checks same company, duplicate IDs, coverage,
   parent/child consistency, current grants and existing memberships. Record
   before/after counts and exact newly inserted IDs for idempotent seed/rollback.
6. Cutover only after negative-access tests and founder signoff. Neither names
   nor seed count becomes a product condition.

## 5. Required tests before implementation is accepted

Use actual local PostgreSQL RLS with synthetic companies, memberships, roles,
private properties and child records. Set authenticated JWT claims per actor;
non-owner/non-BYPASSRLS execution is required. Schema-owner SELECT does not test
RLS. Separate service-code stubs verify export/report authorization. Never write
real guest records or mutate production permissions to create test actors.

| Case | Required concrete outcome |
|---|---|
| Founder / active company director | Sees both spaces and all authorized private operations; finance/export remain explicitly authorized; no unrelated company by title alone. |
| Layantara manager | Reads Layantara private property/bookings/tasks only; Condo-only list/detail/write/export denied unless explicitly cross-granted. |
| Condo manager | Symmetric denial for resort-only private records. |
| Cross-space membership | Only joined extra space available; actions remain bounded by module view/edit/export ceiling; staff duties still required. |
| Cross-company link/member | INSERT/UPDATE assignment and membership rejected; guessed cross-company space/property/detail IDs denied. |
| Inactive company member / revoked space / expired delegate | Access denied through all relevant policy paths; view preference/cache cannot restore access. |
| Read-only member | View succeeds where granted, UPDATE/DELETE/export fail; property visibility must not confer write authority. |
| Reassign property | Old team loses private access, new authorized team gains it after commit; parent/category coverage stays consistent; old response/cache/bulk action cannot leak or write. |
| Active company switch | Space + property + bulk selections cleared; no stale previous-company data, including late in-flight response. |
| No-space legacy | Non-enforced company retains audited legacy; enforced ordinary member with zero grants denied; union for multi-space member never company All. |
| Direct query and bypass siblings | Negative tests on bookings, financials, CRM tasks, orders/items/participants, assignments, reports/exports and private storage—not just property lists. Preserve public listing/guest/owner contexts. |
| Space member without finance/HR/export | Cannot retrieve monetary/private staff/contact fields through alternate endpoint; no hidden-data UI-only protection. |
| Invalid/empty scope / resolver failure | No broadened query; denial/error distinct from empty portfolio and all-clear. |
| Resort / Condo projections | Same authorized physical set across Today, Calendar, Bookings, Properties; parent/category is not counted as invented physical room. |
| Canonical regression | Existing half-open/date/TZ and inventory-status tests unchanged/green; no altered rates, booking/payment/task transitions. |
| Finance E5 conservation | Company total = attributed spaces + unallocated, once per transaction/currency; transfers and historical periods follow approved attribution; ledger reconciliation preserved. |

Retain existing synthetic UI suites at RU/EN × 375/390/430/1280; add context
dispatch/denied/loading/empty and cache tests when runtime implementation begins.
Current `mc-hard-suite` fixtures are reusable scenario data, not evidence of live
RLS isolation. No new tests are needed merely to validate this proposal's prose.

## 6. Approval gate and recommendation

Approve primary property assignment, company-member reference, company capability
ceiling, staff restriction, explicit cross-space membership, no-space cutover and
reviewed seed manifest before E1. If different capabilities per space are needed,
resolve normalized grant design before schema, rather than adding JSON later.

**Рекомендую:** three-table primary-scope model referencing existing company
members and reusing company RBAC; it adds the missing boundary without duplicating
the company, property, employment, task or finance models. Implementation awaits
explicit approval and the audit's inventory/security prerequisites.