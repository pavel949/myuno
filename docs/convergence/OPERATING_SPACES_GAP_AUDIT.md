# Operating spaces — current gap audit

2026-10-17 · Tranche 2E · read-only audit / documentation only.
Source baseline: `9d7a1aeac05a91eb9049988e87fe5fff7af09ed8`.
Design: [minimal operating-space design](../canonical/OPERATING_SPACES_DESIGN.md).
Authority: [connected blueprint](../canonical/MYUNO_CONNECTED_PRODUCT_BLUEPRINT.md),
[PROJECT](../../PROJECT.md). Earlier accepted booking/calendar/Today work is retained.

## 1. Evidence standard and result

**Current maturity for one company / two isolated operational teams: 3/10.**
This is an engineering rubric, not a production KPI: company boundary 1/1;
property portfolio primitives 1/1; granular staff authorization 0.5/1;
consistent surface scoping 0.5/1; nested space entity, defaults, enforced team
isolation, space finance, relationship scope, authenticated isolation evidence
each 0/1. The existing PMS is reusable; the required internal security boundary
is not implemented. This is not an assessment of overall product maturity.

Labels: **IMPLEMENTED** = current code or live catalog proves the mechanism;
**PARTIAL** = mechanism exists but does not cover this scenario;
**MISSING** = absent from inspected current scope/catalog;
**LEGACY** = retained compatibility/deleted predecessor, not a new authority;
**UNKNOWN** = evidence does not establish the result. Recommendations below are
not deployed behavior. Source line ranges refer to the baseline above.

Three independent read-only source investigations covered PMS, authorization,
and finance/relationships. Live evidence used project-bound `lovable supabase
query --environment production --json` with SELECT only. Backend metadata matched
the configured production instance; no alternate database was substituted.
Catalog reads used `pg_class`, `pg_attribute`, `pg_constraint`, `pg_policies`,
`pg_proc`/`pg_get_functiondef`, and `information_schema.role_table_grants`.
Aggregates exposed no guest/contact records, credentials, phone numbers or pay.
No authenticated negative access probe, export, report-send, booking, seed,
migration or other writer was executed. Catalog policies prove definitions,
not a successfully exercised authorization boundary under team sessions.

### Live aggregate observations (not physical inventory assertions)

| Observation | Result / interpretation |
|---|---|
| Management companies | 2 rows. Ignatev Estate has 8 company-linked property rows, 1 `is_active`; other company has 25, 23 active. No deleted/status exclusions in this aggregate. |
| All `properties`, grouped by `property_kind` | 33 `unit` rows; 33 company-linked; 0 parent-linked; 0 category-linked. |
| Categories and active access assignments | 0 `property_room_categories`; 0 active `property_manager_assignments`; 0 active delegates. |
| Company membership roles | 3 active directors, 1 active manager across both companies. This does not identify Rey/Olya or establish their permissions. |
| Staff directory | 3 active rows: 2 staff, 1 manager; not authenticated employment/account mapping. |
| Named project lookup | Title Legendary / Base project rows exist but have 0 `properties.project_id` links in the inspected joins; Layantara/Oceanstone names did not match this project-name lookup. |

The user's **39 physical Layantara villas** is the required operating reality,
not verified populated database stock. No conclusion that these assets do not
exist physically, or cannot exist under another identifier, follows from this
catalog. A reviewed ID-based inventory manifest is required before backfill.

## 2. Reusable foundation and access mechanics

| Finding | Status | Current evidence / limitation |
|---|---|---|
| Company tenant and membership | IMPLEMENTED | `management_companies`; `management_company_members` has UUID PK, company FK, unique `(company_id,user_id)`, role check director/admin/manager/accountant/staff/member, active flag. |
| Active company | IMPLEMENTED | `src/hooks/useActiveCompany.ts:61–112`: own active memberships, stored company choice or alphabetical first. Company is not a space. |
| Company property portfolio | IMPLEMENTED | `properties.management_company_id` FK; `src/hooks/useMyProperties.ts:43–62,66–205` combines owned, assigned-manager and company rows, filters company/deleted as applicable, deduplicates by physical `property_id`. |
| Shared accessible IDs | PARTIAL | `src/lib/getAccessiblePropertyIds.ts:30–57`: owned + active delegates + company-filtered rows; ignores query errors, delegate expiry and capabilities; no assigned-manager branch. Not equivalent to `useMyProperties`. |
| Assigned managers | IMPLEMENTED | `src/hooks/useAssignedProperties.ts:55–135`: active `property_manager_assignments.manager_user_id`; booking enrichment occurs before JS company filtering. Assignment ID differs from physical property ID. |
| Staff directory | PARTIAL | Live `staff_members` has `owner_id`, `company_id`, role/pay/contact fields, **no `user_id`**. `src/hooks/useStaffMembers.ts:31–104` reads company or creator-owned staff. Creator `owner_id` is not employee identity. |
| Old staff-property assignments | LEGACY | Dropped in `supabase/migrations/20260605181220_c1e6a48a-563d-4d68-b8d0-a13ee9a576f8.sql:12–14`; hook comment `useStaffMembers.ts:167`. Live catalog has `property_manager_assignments`, not this deleted entity. |
| Per-property delegation | PARTIAL | Live delegates include permissions, status and expiry; `check_property_permission` checks active/unexpired delegate JSON but checks ownership through `owner_properties`. ID helper does not enforce the same expiry/capability contract. |
| Company module RBAC | PARTIAL | `src/hooks/useTeamPermissions.ts:23–51,82–110`; live `mc_can_access`: director/admin/platform bypass, otherwise active membership AND matching company/user/module view/edit/export. No space dimension. Client helper only view/edit. |
| Server context | PARTIAL | `src/hooks/useResolvedContext.ts:37–99`; live `resolve_user_context` validates actor, resolves company and view-module array, but no operating space or action-level result. It is separate from local active company. |
| Portfolio grouping | PARTIAL | Project/complex filters and selected property exist; none defines a team-scoped security boundary. |
| QA isolation | PARTIAL | `src/test/mc-hard-suite/rls-isolation.test.ts:1–9,86–131` explicitly simulates fixture filters; not authenticated RLS tests. |

### Live authorization facts that prevent a UI-only solution

- **PARTIAL:** `staff_can_access_property(user,property)` allows active company
  directors/admins **and managers/accountants all company properties**; staff
  need active `property_manager_assignments`; platform admin/uno_team bypass.
  This predicate controls both company property SELECT and UPDATE. It does not
  distinguish view from edit. Narrowing a page cannot narrow those permissions.
- **PARTIAL:** `property_bookings.mc_members_view_property_bookings` and
  `property_financials.mc_members_crud_property_financials` allow any active
  membership via the property's company. The latter is ALL, not finance-only.
  Module or staff-assignment checks on properties do not automatically restrict
  these independent permissive policies.
- **PARTIAL:** ledger account/entry MC read policies permit active company
  members at account level. Entries lack a direct physical-property/space FK.
- **PARTIAL:** live CRM SELECT/INSERT/UPDATE use `mc_can_access`; CRM DELETE
  also permits active manager roles without that module test. Live `crm_tasks`
  company policies do **not** test `is_active` or module capabilities.
- **PARTIAL:** assignment ALL policy includes platform `staff`; owner and own
  assignment branches coexist. Reuse only after explicit review of who may
  grant operational access, not because a role name resembles employment.
- **PARTIAL:** owner/provider/org/guest/admin policies are independent OR
  routes. PostgreSQL permissive policies union access: adding one restrictive
  looking space policy does not subtract broad existing allowances.
- **IMPLEMENTED public access / security risk to assess:** approved active
  properties are publicly SELECT-able on the base table. Public marketing
  visibility must remain possible; it must not imply access to private PMS
  fields, guest records or writes. Row RLS cannot hide private columns on a
  public row; review grants/projections before claiming private-space isolation.
- **UNKNOWN exploitability:** catalog/source conditions above are proven;
  actual unauthorized retrieval under restricted sessions was not attempted.
  No team isolation or absence of leaks is certified in this tranche.

Live functions inspected: `staff_can_access_property`, `can_manage_property`,
`check_property_permission`, `resolve_user_context`, `is_company_member`,
`is_mc_member`, `is_mc_admin`, `is_company_admin`, `get_user_company_ids`,
`is_assigned_manager`, `mc_can_access`. The latter two access helpers and
company admin paths retain existing semantics; no replacement was deployed.

## 3. Can an existing entity be an operating space?

| Candidate | Verdict | Reason |
|---|---|---|
| `management_companies` | IMPLEMENTED tenant, unsuitable internal space | Creating two fake companies changes counterparty, membership and reporting semantics. |
| `property_projects` | IMPLEMENTED property catalog, unsuitable scope | One Condo space spans many projects; one project is not an employment/access boundary. `src/hooks/usePropertyProjects.ts:80–126,186–202`. |
| Parent resort / category | IMPLEMENTED structural model, unsuitable team scope | `property_room_categories.property_id` → parent property; physical children use `parent_property_id` / `room_category_id`. No team boundary; live population incomplete. `src/hooks/useRoomCategories.ts:12–20,39–73`. |
| `orgs` / org membership | IMPLEMENTED separate organization domain, unsuitable drop-in | Provider/order counterparty and permissions already depend on orgs. No audited canonical MC-child-space relationship. Never conflate IDs. |
| `team_members`, channels, shifts | IMPLEMENTED other purposes, unsuitable scope | Platform team identity has user FK; channels are communication; shifts are work records. None is company→portfolio assignment authority. |
| Dashboard/property filter | IMPLEMENTED view preference, unsuitable security | Local selection only, not server permission. |
| `property_complexes` / `development_units` | LEGACY, forbidden new authority | Preserve adapters only; do not revive deprecated inventory for operations. |
| Operating-space entity | MISSING | No matching space/portfolio membership and property-assignment table in live catalog or audited consumers. Materialized portfolio summary is reporting, not scope. |

**Conclusion:** a small additive scope layer is justified; no suitable existing
canonical entity was proven. See the design for membership choice and RBAC reuse.

## 4. Source-of-truth impact map

Future default **D** on every operational row below: verified director/company
admin/platform superadmin → authorized All in active company; other employees →
saved authorized space, sole space, otherwise union of their authorized spaces.
Zero spaces on an enforced company → explicit no-access, never company fallback.
Legacy companies retain documented legacy behavior until reviewed cutover.
Personal owner/guest contexts remain separate. Explicit property/detail IDs must
intersect authorized scope even when a filter is absent. Errors ≠ empty ID lists.

| Surface / maturity | Current scope and exact source | Future optional filter / query changes | RLS / blast radius / default |
|---|---|---|---|
| Today — PARTIAL | `usePmsToday.ts:75–110,114–145` active `useMyProperties` IDs → `property_bookings`, service requests, `crm_tasks`; `PmsTodayPage.tsx` projects results | Same IDs intersect space; key includes actor/company/space/scope version; no new Today API/data model | Yes for three datasets; property/service error visibility and task access separate. D; keep active-only definition and dates. |
| Calendar — PARTIAL | `OwnerCalendar.tsx:39–70,169–221`; `MultiPropertyTimeline.tsx:44–45,96–147`; `useMultiPropertyBookings.ts:19–57` queries all portfolio orders though rows can be group-filtered | Explicit scoped physical IDs through bookings/tasks/docs/planned expenses; project groups compose with space; reset selected day/property | Yes orders/items/participants/tasks/docs/financials; D. Single and portfolio agree. No date/inventory change. |
| Bookings — PARTIAL | `MCBookingsPage.tsx:76–83,187–190`; `usePropertyBookings.ts:121–160,560–636` shared resolver → orders/items/participants | Optional resolver intersection in list/detail/enrichment/export; clear bulk selection on scope change | Yes commercial routes and checked write guards; D. Read hook also contains writers: do not casually rewrite it. |
| Properties — PARTIAL | `useMyProperties.ts:43–205`; `useAssignedProperties.ts:55–135`; `usePropertyCare.ts:60–74` | Reconcile owned/manager/delegate sources; narrow intermediate reads, not just displayed union | Yes private property paths; D. Preserve physical property IDs and public catalog. |
| Operations — PARTIAL | `OwnerOperations.tsx:42–52`; `useOperationalTasks.ts:68–145` → **`property_operational_tasks`**, not Today CRM tasks | Intersect all/selected property and range/status queries | Yes task/request/detail/writer authority; D. Maintain separate canonical task sources. |
| Rates — PARTIAL | `RateManagementPage.tsx:49–85`; `usePropertyRateSeasons.ts:35–72,79–173`: company portfolio selector but owner-only seasons | Authorized parent/physical IDs for seasons/logs/targets, retain category rate owner | Yes pricing-management access; D. No price/formula/restriction changes. |
| Inventory — PARTIAL | `PropertyStructurePage.tsx:31–39` + `useRoomCategories`; supplies `InventoryPage.tsx:40–109` queries `property_inventory_items.owner_id` | Resort parent/category/child coverage explicit; supplies need real property filter and scope key | Yes authorized management access; D. Supplies ≠ rental inventory. Never change exclusion/availability. |
| Finance/performance — PARTIAL | `usePropertyFinancials.ts:92–138,158–185,250–301`; `useOwnerPerformance.ts:75–144`; `useFinancialPlanning.ts:31–89,121–170` | Scoped read IDs even for explicit property; same reporting portfolio; separate currency and historical attribution review | Yes financial rows/ledger/accounts/privileged reports. D **plus finance capability**, not every space member. No P&L claim before E5 gates. |
| CRM — PARTIAL | `useCrmContacts.ts:137–151,226–240`; `useContactProperties.ts:45–132`; `useCrmTasks.ts` | Property-linked operational work can intersect scope; contact-global fields and propertyless deals cannot be inferred from a link | Yes contact/link/task/deal ACLs. D only for safely linked work; full CRM needs company module grant. No copied contacts/migration. |
| Owners — PARTIAL | `useOwnerAccounts.ts:65–98`, `usePropertyOwners.ts:25–50` and property owner/contact fields | Derive visible asset-owner associations from scoped properties; keep person deduplication and private owner rights | Yes relationships/private owner data; D. Owning another home does not grant staff scope. |
| Staff — PARTIAL | `useStaffMembers.ts:10–104,123–167`; `useTeamPermissions.ts`; `team_shifts`/`team_timesheets` | Authorized company users/space members for login access; staff directory lacks account link; shifts with property can narrow, propertyless work needs explicit policy | Yes member/HR/pay/shift access. D + staff/HR capability. Membership cannot reveal salaries by default. |
| Dashboard — PARTIAL | `OwnerDashboard.tsx:348–350,521`; `DashboardPropertyFilter.tsx:9–13`; `DashboardFilterContext.tsx:14–15`; `useDashboardMetrics.ts:41–170`; `useDayBriefing.ts:108–288` | One resolved scope through each operational branch, reset selected property. Personal/global reminders stay distinct | Yes underlying datasets, not a new dashboard store. D; All founder view must reconcile disjoint subsets and unassigned bucket. |

Additional context/shell blast radius: `src/hooks/useActiveCompany.ts`,
`src/hooks/useResolvedContext.ts`, `src/hooks/useAgentDeals.ts:142–165`
(`useMyCompanyId` has independent first-membership fallback),
`src/components/layout/AnimatedRoutes.tsx:763–764`,
`src/components/mc/MCLayout.tsx:9–18`, `src/components/layout/AppLayout.tsx:91–100`,
existing `NavShell`, `src/lib/navConfig.ts`, `src/lib/config/routes.ts`.
Reuse shell/routes; no new shell/top-level route. Company switch currently
invalidates rather than evicts caches; permission edits invalidate only
`member-permissions`, not actor permissions/resolved context. Neither is a
security boundary. Future keys need actor + company + space + authorization
revision; cancel in-flight reads, evict restricted results, reconcile selections.

## 5. Exact two-team gaps and financial/relationship risks

**MISSING:** reviewed Layantara/Condo physical ID assignments, space members,
default scope, explicit cross-space grants, server scope enforcement, consistent
queries and authenticated negative tests. A manager role currently grants
company-wide property access. Staff directory role is not auth identity.
**UNKNOWN:** Rey/Olya account mapping, precise team capability matrix, physical
villa import status and whether hidden/legacy rows encode the resort elsewhere.

**PARTIAL Finance:** `property_financials` is property-attached; ledger entries
reference accounts/orders, not spaces. Raw stats do not select currency before
summing (`usePropertyFinancials.ts:250–301`). `useOwnerPerformance.ts:103–125`
selects bookings by creation date and sums complete stay nights, not clipped
period occupancy. These are confirmed computation/query limitations, not proof
of incorrect specific live totals. Planning scenarios are not reconciled actual P&L.

**PARTIAL privileged paths:** `supabase/functions/export-mc-data/index.ts:45–107`
authorizes active director/admin/**manager**, then service-client exports company
data without `can_export` or property restriction. Scheduled backups
(`scheduled-mc-backup/index.ts:53–67`) and monthly statements
(`monthly-owner-statements/index.ts:51–77`) independently derive current company
property IDs. Reassignment can reclassify history under current-scope reports;
shared/propertyless costs lack a demonstrated allocation mechanism. Do not
duplicate bills to invent space P&L; keep unallocated totals visible to authorized
finance/company oversight until a reconciled attribution design is approved.

**PARTIAL / priority security review:** `send-property-report/index.ts:22–49,78–95`
checks only a Bearer-shaped header in the handler, fetches supplied report ID
with service authority, accepts recipients and writes sent status. Handler-level
object authorization is absent in inspected source. Deployed gateway verification
and exploitability are UNKNOWN; this audit never invokes it. A verified user JWT
alone would still not establish report ownership. Must be reviewed before E5.

**PARTIAL relationships:** CRM contact detail key/ID has no active-company
intersection (`useCrmContacts.ts:226–240`). Owner directory associations through
`owner_contact_id`, `property_owners`, and auth `owner_id` are different facts.
`supabase/migrations/20260520000000_crm_contact_links.sql:20–56` has source
membership checks without active/module/property consistency; live link-policy
parity is UNKNOWN (not queried). Do not promote relationship to authorization.

**LEGACY / stale read:** `useChecklists.ts:86–99` still references removed
completion infrastructure noted in prior read-only inspection. Not repaired here;
reconfirm deployed object before later checklist scope changes.

## 6. Migration risks and implementation blockers

1. **Inventory manifest:** current links do not substantiate 39 populated villas
   or named project relations. Founder must approve physical IDs, parent/category
   identities, company ownership and initial team account/member IDs.
2. **Permission decision:** approve space-limited managers/accountants, staff
   assignment intersection, finance/HR/export ceilings, cross-space grants and
   explicit authorized All. Do not silently demote existing broad users.
3. **Bypass closure:** existing permissive policies, org order access, owner and
   public paths, service-authority exports and reports must be included. Three
   new tables alone cannot enforce two-team isolation.
4. **Legacy cutover:** company-by-company scope-enforcement switch, orphan/
   unassigned property handling and compatibility consumers must be reviewed.
   Turning a UI flag off must never restore broad authority after enforcement.
5. **Historical finance:** choose current operational reporting vs historical
   accounting attribution; allocations/shared costs are not solved by a scope.
6. **QA environment:** shared production is not staging. Future RLS negative
   tests need local isolated Postgres schemas/fixtures and controlled auth claims;
   full hosted tests require separately authorized isolated records/environment.
7. **Unchanged inherited gates:** separate CI typecheck and safe Stripe E2E remain
   blocked as documented in `TRANCHE1_REMAINING_CHECKS.md`. Mixed timestamps/custom
   time overlap remain separate accepted risks, not reopened by this design.

No blocker prevents delivering this audit/design. These block implementation
or security certification, not documentation completion.

## 7. Reproducible read-only catalog evidence

Representative exact queries (execute independently; never combine with writes):

```sql
SELECT c.relname, c.relkind, c.relrowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','v','m')
AND (c.relname ILIKE '%space%' OR c.relname ILIKE '%portfolio%'
     OR c.relname ILIKE '%staff%' OR c.relname ILIKE '%team%');

SELECT c.relname, con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public'
AND c.relname IN ('management_company_members','property_manager_assignments',
 'team_member_permissions','staff_members','properties','property_room_categories');

SELECT tablename,policyname,cmd,roles,qual,with_check FROM pg_policies
WHERE schemaname='public' AND tablename IN ('properties','property_bookings',
 'property_financials','crm_contacts','crm_tasks','staff_members',
 'management_company_members','property_manager_assignments',
 'team_member_permissions','orders','order_items','order_participants',
 'ledger_accounts','ledger_entries','team_shifts','team_timesheets');

SELECT p.proname,pg_get_functiondef(p.oid)
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN ('staff_can_access_property',
 'mc_can_access','resolve_user_context','can_manage_property',
 'check_property_permission','is_company_admin','get_user_company_ids');

SELECT mc.name_en,count(p.id) AS properties,
 count(p.id) FILTER (WHERE p.is_active) AS active_properties
FROM management_companies mc LEFT JOIN properties p
ON p.management_company_id=mc.id GROUP BY mc.id,mc.name_en;

SELECT property_kind,count(*) AS properties,
 count(*) FILTER (WHERE parent_property_id IS NOT NULL) AS parent_linked,
 count(*) FILTER (WHERE room_category_id IS NOT NULL) AS category_linked
FROM properties GROUP BY property_kind;
```

`owner_properties` is a live view with `security_invoker=true`;
`mv_portfolio_health_summary` is a materialized view, not an operating entity.
Catalog/grant outputs were inspected in temporary audit files only; no raw
production dump is committed. No tests were added to pretend future isolation
exists. Documentation QA checks file scope, links, required deliverables and
whitespace; runtime build/tests are unnecessary for this documentation-only diff.

**Рекомендую:** approve the nested scope contract and ID-based seed manifest,
then E1 shadow schema/local RLS tests; do not start runtime filters before
independent broad authorization paths are accounted for.