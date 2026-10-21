# E2.5 — security cutover readiness

2026-10-17 · Baseline `2862c9aef9fd09e7fb13267721b6fefc3036e3e5`.
Authority: [design](../canonical/OPERATING_SPACES_DESIGN.md), [gap audit](OPERATING_SPACES_GAP_AUDIT.md),
[E1](OPERATING_SPACES_E1_IMPLEMENTATION.md), [E2](OPERATING_SPACES_E2_RESOLVER.md),
[bypass register](MANAGER_SCOPE_BYPASS_REGISTER.md).

## Result and safety boundary

E3 **blocked**, not started. This is narrow forward security readiness, not a
claim that the whole platform is space-isolated. No scope activation, assignment,
PMS query/UI connection, historical data change, booking/payment transition,
email, export download, background-job execution or production test mutation.
Shared backend migrations and edge deploys are live, not staging.

## Evidence / register disposition

Evidence: current source; production SELECT catalog (`pg_policies`, `pg_proc`,
function definitions/ACLs, columns, view definitions/options); cron **job names and
active flags only**, never command strings containing credentials. No live exploits.
Source proof does not certify a deployed version until explicit deployment succeeds.

| Register path | Disposition and change |
|---|---|
| `export-mc-data` | **PROVEN BYPASS → hardened**: active manager could export every company property with service role. JWT verified, actor-bound company export RPC before service client. Legacy director/admin/manager exactly preserved; enforced ordinary manager denied full export, including CRM/shared finance. Overseer must pass existing export capabilities. No unsafe partial export invented. |
| `send-property-report` | **PROVEN BYPASS → hardened**: bearer shape only, no object check, arbitrary report ID and recipients. Verified JWT, server report→property→company lookup and report/edit + finance/view + scope/duties before service client. Personal report owner/generator additionally requires existing financial property ACL. Invalid/foreign report denied uniformly. |
| Caller recipient input | `ReportsPage.tsx:304–310` explicitly accepts comma-separated recipient email addresses. This proves product choice, not recipient authorization. Validated max 20 email addresses; only authorized sender can use existing choice. Internal distribution is stricter: exactly one trusted auth-account owner email. Delegation ACL weaknesses remain a blocker below. |
| `monthly-owner-statements` | **NOT USER-CALLABLE by handler contract**: existing exact service key/internal-secret guard. Active cron names `monthly-owner-statements`, `monthly-owner-statements-monthly` confirmed. Company-wide accounting generation retained; new internal report sender checks trusted owner recipient. Generator source/schema drift (`created_by`, missing required report owner/generated_by) and unchecked send response NOT corrected as unrelated accounting behavior; distribution can fail closed. |
| `scheduled-mc-backup` | **NOT USER-CALLABLE by handler contract**; active `mc-auto-backup-daily-check` confirmed. Internal exact secret; company-wide backup generation retained. Storage distribution is **PROVEN BYPASS / BLOCKER**: `MC members can read own backups` allows any active member; managed storage schema policies were not changed. Existing uploaded path is `backups/<company>/...`, policy expects first segment company; actual affected objects not inspected. E3 blocked pending distribution policy/path review. |
| `send-order-email` | **PROVEN BYPASS → hardened**: no handler auth; client could mix supplied `user_id`/`order_id` then service-fetch recipient/order. Internal workflow retained; browser resend requires verified actor as customer and actor-RLS order lookup, matching user ID, persisted status for confirmation/cancellation. User-triggered wallet confirmation denied (only trusted workflow). |
| `notify-order-status-change` | **PROVEN BYPASS → hardened**: shared wrapper did no auth. New wrapper requires exact internal secret or protected platform admin role; ordinary uno_team/manager denied. Supplied new_status must equal server order.status before distribution. Existing customer recipient comes from trusted order. |
| `notify-admin-order` | **PROVEN recipient escalation → hardened**: public lead body could inject manager email/phone into platform notifications. Public-to-configured-admin lead notification retained; supplied third-party manager distribution removed. No database object read exposed here; anonymous admin spam/rate limiting remains a separately documented abuse risk. |
| `calendar-export` | **PROVEN SAFE for its token-feed contract**: per-property token, not a staff JWT or company export. Token leakage/revocation is a separate credential capability risk; no changes. |
| `crm-ai-assistant` | Company membership/JWT, company CRM context retained. **PROVEN company-level behavior, NOT isolated property access**; CRM/owner scope decision unresolved. |
| `getAccessiblePropertyIds`, `useMyProperties`, `useAssignedProperties` | Source confirmed company unions; not service-role bypasses themselves. **UNCHANGED**. New restrictive direct-record ceilings operate beneath list/detail filtering; no E2 reader mounted. |

### Register §2 functions

Live authenticated SECURITY DEFINER functions confirmed:
`staff_can_access_property`, `is_mc_member_for_property`, `mc_can_access`,
`is_company_member`, `is_mc_member`, `is_mc_admin`, `is_mc_director`,
`is_company_admin`, `get_company_member_role`, `resolve_user_context`,
`get_crm_pipeline_summary`, `get_management_company_sensitive`.
Older property/company-wide predicates remain **PROVEN BYPASS candidates when
used outside covered restrictive tables**; not universally replaced.
`mc_can_access` live definition has generic uno_team bypass: enforced new property
authorization uses explicit `team_member_permissions` for ordinary members instead.
Existing staff assignment duty is intersected, never widened by space membership.
Company-only and CRM RPCs stay unchanged, with E3 blocked where they expose shared
private data to scoped teams without a product decision.

`get_user_company_ids(uuid)` anonymous EXECUTE was confirmed and revoked;
authenticated/service_role kept. Trigger functions `auto_create_deal_from_lead()` /
`autocreate_capital_lead_from_booking()` had direct authenticated EXECUTE and it was
revoked; trigger definitions/side effects unchanged. Trigger returns are not
ordinary callable APIs (invocation normally errors), so no live exploit claimed.

### Register §3 direct tables

**Covered by new restrictive policies**: `properties` SELECT/UPDATE/DELETE;
`property_bookings`, `property_operational_tasks`, `property_reports` ALL.
Policies AND existing permissive grants; no new access grant or lifecycle writer.
Guessed foreign-space IDs and update/reparent attempts are denied for company
employees/uno_team in enforced context. Four actual tables tested locally with
synthetic broad legacy policies and actual authenticated non-owner PostgreSQL RLS.

**Current catalog confirmed, NOT changed / E3 blockers**:
- `property_booking_status_history` (`View property booking history`),
  `booking_notifications_log` (`MC members can view booking notifications`).
- `property_financials` (`mc_members_crud_property_financials`),
  `property_payout_rules`, `property_accounting_policies`.
- `property_rate_seasons` (`MC members manage/view rate seasons`, public active
  read and owner branches), `property_price_offers` (`Managers can manage price offers`).
- `property_documents`, `property_owners`, `property_activity_log`,
  `property_checklist_templates`, `property_inquiries`.
- `owner_invoices`, `owner_payouts`, `owner_statement_approvals`, `owner_portal_settings`.
- `ledger_entries/accounts` (`MC members can view MC ledger entries/accounts`),
  `inventory_listings`, `staff_members` (`mc_members_view_company_staff`).

These need capability/customer/owner/attribution review and coordinated cutover;
no unreviewed finance/HR/owner denial invented. New helper is available to that
work; E3 must not claim closure merely because four direct tables are covered.

§4 company-only CRM/deals/contact/API/storefront/category settings remain
company-level. Property-bearing CRM task rows remain a bypass/readiness blocker.
§5 `management_companies_public` company projection is not a property scope substitute.
`owner_properties` inspected live is `security_invoker=true`, reading `properties`;
it inherits new authenticated ceilings, but still carries extensive private columns.
`properties` public approved-row SELECT policies and anonymous grants remain:
**public base-row private-column exposure is a proven unresolved design risk**;
an employee can sign out to public rows. Marketing/private projection separation
is required before isolation certification, not falsely solved by authenticated RLS.

Additional reviewed source gates: `register-mc` binds creation to JWT actor;
`invite-team-member` director/admin target-company gate; subscription/customer portal
uses existing company authorization; admin subscription management requires admin.
Checkout remains customer booking/payment, not a staff export; no payment changes.
This is targeted register/caller inventory, not an exhaustive certification of
all 165+ edges or arbitrary service-role SQL.

## Server authorization contract / migration

Applied `drizzle/migrations/0023_operating_security_ceilings.sql`; 0021/0022 unchanged.
All actor checks from `auth.uid()`, fixed search_path public, anon/PUBLIC revoked,
authenticated/service_role EXECUTE explicitly granted. No caller user ID parameter.

- `actor_property_scope_ceiling(property, optional company)`: verifies physical
  property/company relation; false on missing/anonymous/forged relation. Personal
  or unenforced context passes **ceiling only**, never grants access by itself.
  Enforced oversight uses E2; ordinary requires active company + active member of
  active assigned space; unassigned only overseer.
- `actor_can_operate_property(property,company,module,action)`: legacy intersects
  existing staff predicate and mc_can_access; enforced explicit module/action
  permissions plus staff assigned-property duty; overseer existing capability.
  Whitelisted modules/actions, null never All; not universal RBAC replacement.
- `actor_can_export_company(company)`: legacy exact previous role gate; enforced
  overseer + properties/reports/finance/crm export checks. All export types use
  same conservative full-company contract, ordinary enforced manager denied.
- `actor_can_send_property_report(report)`: trusted object lookup; existing report
  write/financial access intersections and scope. No report owner/name/email guess.
- `actor_private_property_ceiling(property)`: only additional restrictive AND
  for employee/uno_team context; independent public/guest/owner rights remain.
  Not a standalone permission RPC, no module/action grant; existing permissive
  writers remain the underlying ceiling.
- `lock_operating_space_enforcement`: ordinary authenticated company/platform
  users cannot UPDATE the enforcement column; supervised postgres/service_role
  authority only. Other legitimate company edits unchanged.

Property INSERT remains unchanged because lookup-by-ID cannot authorize a row
that does not yet exist; enforced inventory onboarding/reassignment is an E3 gate.
No company flag toggled by migration or tests against production.

## Validation / rollback / deployment

- Pre-apply: 67/67 (38 PostgreSQL E1/E2/security, 17 E2 controller, 12 edge auth unit).
- Applied migration + retained regressions: 116/116 across six files (40 PostgreSQL security/E1/E2), including
  16 civil-date + 16 inventory unit + 15 inventory PostgreSQL. No threshold lowering.
- Real entrypoint synthetic harness `scripts/qa/operating-security-handlers.mjs`:
  10/10 anonymous/invalid JWT/denied/authorized export and report, trusted scheduler,
  forged internal recipient; service creation only after authorization; network
  forbidden and SDK/email entirely stubbed. No production exports/emails.
- Local SQL fixture stands in for existing legacy RBAC, **not full live schema**;
  applied migration tested exactly. Existing role grants cannot be fully certified
  from these stand-ins; hosted negative-access tests remain blocked by zero seeded spaces.
- Rollback executed locally within reverted transaction:
  [0023](../hardening/rollback/0023_operating_security_ceilings.sql) disables privileged
  export/send primitives; keeps restrictive policies and gate lock. Edge rollback
  must disable relevant endpoints or use hardened code, never restore old bypasses.
- Automatic build OK; no manual application build/typecheck. Edge entrypoints
  separately bundled and exercised for export/report; deploy results below.

Production post-apply SELECT aggregates: **2 companies, 0 enforced; 0 spaces,
0 property assignments, 0 space memberships**. New primitives anon EXECUTE=false;
`get_user_company_ids` anon=false; both trigger functions authenticated=false.
Deployment tool succeeded for all five changed edges; final export/report sources
were redeployed after error-handling improvements. This proves submitted deployment,
not independently downloaded live-byte parity or an actual email/export journey.
No production handler invocation occurred; all handler calls were local SDK/mail stubs.
Newest observed automatic build `2026-10-17T03:58:17Z`: build OK.

Independent review flagged ignored export errors: corrected across all queries;
failed retrieval is no longer a successful empty export. Report delivery/status
failures are handled. Its proposed INSERT lookup policy would deny valid new rows
because the property does not exist yet; not applied. INSERT remains an explicit
E3 blocker requiring row-company-aware supervised inventory onboarding, not an
untested lookup policy. Internal secret intentionally grants company-wide scheduled
report distribution; ordinary users cannot supply it, and owner-only recipient
pinning protects distribution. No speculative internal space identity was invented.
Added concrete owner-financial ACL, staff-duty and uno_team module tests; the
review's assertion of absent tests was contradicted by the actual fixture/harness.

## Exact changes

Migration plus generated snapshot/journal/types; `AGENTS.md`, `roadmap.md`, this
report and linked bypass-register addendum; rollback file.
Runtime edge edits: `export-mc-data/index.ts`, `send-property-report/index.ts`,
`send-order-email/index.ts`, `notify-order-status-change/index.ts`,
`notify-admin-order/index.ts`; shared additions `operating-space-auth.ts`,
`order-email-auth.ts`, `report-access.ts`.
Tests: extended `src/lib/__tests__/operatingSpaces.postgres.test.ts`, fixture
`fixtures/operating-security-base.sql`, `src/test/edge/operating-space-security.test.ts`,
real-handler harness. No PMS pages/hooks/components touched.

## E3 stop gates and recommendation

1. Confirm physical property/team manifests and existing module/action grants.
2. Public/private property projections and backup storage distribution closure.
3. Legacy delegation and permission assignment grants: live `Property owners can
   manage delegates` trusts invited_by/user_id. Live `is_mc_admin` was read and
   permits only active company director/admin, no generic uno_team branch;
   permission management's existing gate is retained. Assignment ALL
   allows platform staff/uno_team. New scope ceiling does not repair grant governance.
4. Uncovered financial/owner/task/order siblings, provider-org order access,
   module duties and effective historical finance attribution need coordinated RLS.
5. Hosted synthetic negative tests after explicit approval, verified deployed
   handlers and scheduler distribution, no real sends to test authorization.

**Recommendation:** E3 may not start. First close public/private and backup
distribution plus grant-governance blockers, then approve manifests and coordinated
cutover. Do not enable scope based on passing resolver/entrypoint tests alone.
## Continuation (2026-10-17) — migrations 0024 and 0025
See `OPERATING_SPACES_E2_6_CUTOVER_BLOCKERS.md` for 0024. Migration `0025_delegation_company_guards.sql` (rollback `docs/hardening/rollback/0025_delegation_company_guards.sql`) closes legacy-mode bypasses proven against the live catalog:
- **Delegate invite rewrite** — live policy "Users can accept invitations" checked only `invited_email` in WITH CHECK, so an invitee could change `role`, `permissions`, `property_id` or `invited_by` while accepting. Trigger `guard_property_delegate_update`: non-inviter/non-owner/non-admin may only set status pending/active/accepted/declined, bind `user_id` to self, `accepted_at`; expired invites cannot be activated. App flow (`usePropertyDelegates` accept → status `active`) preserved.
- **Property company injection** — `owner_insert_own`/`provider_insert_own` allowed any `management_company_id`. Restrictive `company_placement_insert_ceiling`: non-null company requires active director/admin/manager there, or platform admin.
- **Property company hijack** — `owner_update_own` had no WITH CHECK, so an owner could move a property into or out of a company. Trigger `guard_property_company_change`: changing `management_company_id` requires director/admin (or platform admin) of both old and new company.

### Evidence-only findings, not changed
- **Private fields on approved properties**: anon has column-level grants only and was denied all private columns live (REST probe, counts only). **Authenticated** users hold table-wide SELECT and `public_view_active` exposes every column of approved rows; 8 approved rows carry at least one of lock_code / actual_owner_phone / manager_phone / ical_token. Closing it requires moving 55 reading files to `public_property_catalog` before column revocation — **blocker**, not fixed to avoid an outage.
- **Orders**: live policies are customer / vendor-org / admin only; no manager-company path, so no space bypass. Customer UPDATE breadth (`Order owners can update`, `orders_update_own`) is a separate money-integrity question — **blocker, unverified**.
- Backups, ledger, owner finance, CRM tasks: covered by 0024 under enforcement; legacy mode intentionally unchanged.

### Tests
Isolated PostgreSQL 72/72 in `operatingSpaces.postgres.test.ts` (+4 new); with inventory and edge suites 107/107. Applied 0025 byte-identical to the tested SQL.
Live read-only after apply: enforced 0, spaces 0, assignments 0, members 0; 2 guard triggers and 1 placement policy present.
