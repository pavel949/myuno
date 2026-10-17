# Manager scope bypass register (Tranche E0, read-only)

Date: 2026-10-17. Source: live production catalog via SELECT-only queries
(`pg_policies`, `pg_proc`, `pg_class`) and repository source. No migrations,
seeds, permission changes or data writes were made.

Status legend: CONFIRMED (seen in live catalog/source) · ASSUMED (needs runtime proof).

## Current E2.5 disposition

This E0 register is historical evidence, not deployed scope semantics. See
[OPERATING_SPACES_E2_5_SECURITY.md](OPERATING_SPACES_E2_5_SECURITY.md) for every
section's current source/catalog disposition, new 0023 restrictive ceilings,
export/report handler hardening and unresolved E3 blockers. Generic uno_team
is **not** global operating-space oversight (0022); the old §8 proposal below
is superseded. No companies enforced and no assignments seeded.

## 1. Root cause (CONFIRMED)

Every company-level predicate grants an active company member access to *all*
company rows. PostgreSQL permissive policies are OR-ed, so a future
operating-space policy cannot narrow access while these remain.

## 2. Access predicates (SECURITY DEFINER, executable by `authenticated`)

| Function | Grants | Scope today | Target |
|---|---|---|---|
| `staff_can_access_property(user, property)` | auth | director/admin/manager/accountant → every company property; staff → active `property_manager_assignments` | delegate to `can_access_property_in_scope` |
| `is_mc_member_for_property(property, user)` | auth | any active member of the property's company | same |
| `mc_can_access(user, company, module, action)` | auth | company role × module/action, no space | keep as capability ceiling, AND with space predicate for property-bound rows |
| `is_company_member`, `is_mc_member`, `is_mc_admin`, `is_mc_director`, `is_company_admin`, `get_company_member_role` | auth | company-wide | unchanged (company-level objects) |
| `get_user_company_ids(user)` | **auth + anon** | company-wide | revoke anon in E1a (CONFIRMED grant; exploitability ASSUMED low) |
| `resolve_user_context`, `get_crm_pipeline_summary`, `get_management_company_sensitive` | auth | company-wide | review in E1c; CRM summary stays company-level |
| `auto_create_deal_from_lead`, `autocreate_capital_lead_from_booking` | auth (trigger fns) | writer side effects | revoke direct execute (trigger-only) |

## 3. Property-bound tables using company-wide predicates (CONFIRMED)

These hold per-property operational/financial data and are the minimal set that
must switch to the scope predicate in E1c:

| Table | Commands | Predicate today |
|---|---|---|
| properties | SELECT/INSERT/UPDATE/DELETE | `staff_can_access_property` + direct company membership + public listing/owner routes |
| property_bookings, property_booking_status_history, booking_notifications_log | SELECT | company membership join |
| property_operational_tasks | ALL | company membership |
| property_financials, property_payout_rules, property_accounting_policies | ALL | company membership |
| property_rate_seasons, property_price_offers | ALL | company membership |
| property_documents, property_owners, property_activity_log, property_checklist_templates, property_inquiries | mixed | company membership |
| owner_invoices, owner_payouts, owner_statement_approvals, owner_portal_settings | mixed | company membership |
| ledger_entries, ledger_accounts | SELECT | company MC accounts |
| inventory_listings | ALL | company membership |
| staff_members | SELECT | company membership |

## 4. Company-level tables — intentionally NOT space-scoped (CONFIRMED)

CRM (`crm_*`, 30+ tables incl. `crm_tasks`, `crm_contacts`), `agent_deals*`,
`deal_*`, `contact_*`, `api_keys`, `company_category_settings`,
`company_storefronts`. Owners/contacts may relate to both portfolios; scoping
them requires a product decision (§7 blocker B3). `crm_tasks` is read by Today:
Today must filter tasks by property scope client-side **and** via RLS when a
task has `property_id`.

## 5. Views

`management_companies_public` — `security_invoker=off` (CONFIRMED). Exposes
company-level public fields only; no property rows. No change needed for scope.

## 6. Service-role edge paths

| Function | Auth | Scope check | Finding |
|---|---|---|---|
| export-mc-data | `requireAuth` | director/admin/**manager** of company, then service-role full export | CONFIRMED bypass: manager exports all company properties → require director/admin or space-filter export |
| send-property-report | bearer-shaped header only | none on property | CONFIRMED missing object auth in handler; live exploitability ASSUMED → add `requireAuth` + scope predicate |
| scheduled-mc-backup, monthly-owner-statements | internal secret | n/a (system) | OK; outputs must be delivered only to directors |
| crm-ai-assistant | `requireAuth` + MC membership | company | company-level, acceptable |
| calendar-export | token feed | per-property token | OK |

## 7. Client resolvers (CONFIRMED source)

`getAccessiblePropertyIds`, `useMyProperties`, `useAssignedProperties`
union company-wide properties. They do not bypass RLS but present the broad
set; after E1c they must reflect RLS results only (no extra union).

## 8. Minimal target change (proposal, not executed)

One predicate `can_access_property_in_scope(uid, property_id, capability)`:

```text
platform admin / uno_team                        -> allow
company director/admin (active)                  -> allow all company properties
spaces disabled (feature flag off)               -> current staff_can_access_property result
member of a space holding the property AND
  mc_can_access(capability) ceiling              -> allow
staff with active property_manager_assignment    -> allow
otherwise                                        -> deny
```

Policies in §3 are **replaced** (drop + create in one migration) to call it;
§2 helpers delegate to it. With the flag off, the result equals today's access,
so E1a is behavior-neutral.

## 9. Blockers

- B1 Confirmed list of properties per portfolio (live DB: 0 `project_id` links, 0 room categories; Layantara 39 villas not in DB).
- B2 Confirmed team members per portfolio and their company roles.
- B3 Product decision: CRM/owners stay company-wide or become space-scoped.
- B4 Decision on `send-property-report` hardening (can ship independently, auth-only).

## Status update 2026-10-17 (0024, 0025)
| Path | Status |
|---|---|
| mc-backups member read | Fixed under enforcement (0024) |
| Sibling property tables (16+2), owner finance, CRM tasks, ledger | Ceilinged under enforcement (0024); null-property/ledger fail closed |
| Assignments / permissions / delegate insert-delete governance | Overseer-only under enforcement (0024) |
| Delegate acceptance rewrite | Fixed in all modes (0025) |
| Property INSERT into foreign company | Fixed in all modes (0025); enforced companies use checked RPC (0024) |
| Property company change by owner | Fixed in all modes (0025) |
| Authenticated read of private columns on approved properties | **Fixed (0026, 0027)** — public consumers on `public_property_catalog`; base approved-row policies limited to anon (column-granted); see E2_7 report |
| Active property delegates reading approved-property titles via base table | **Open, accepted** — 0 active delegates live; no delegate policy added because it would expose private columns |
| Generic `uno_team` PMS read via `staff_can_access_property` | **Open, pre-existing** — not changed in E2.7; needs separate RBAC decision |
| Order customer update breadth | **Open, unverified** |
