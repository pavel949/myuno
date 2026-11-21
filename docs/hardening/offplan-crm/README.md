# Checked off-plan CRM conversion — review only

Do not apply this SQL or wire the operator UI yet. This finite candidate uses
`consultation_requests.converted_deal_id`, `agent_deals`, and
`agent_deal_activities`; no new state domain or generic converter change.

## Scope
- Signed-in stored platform admin, active owner/admin of exactly the named,
  active company, existing CRM view/edit permission, explicit enforced space
  via `resolve_operational_scope(company, space)`. Empty or legacy is denial.
- The same actor must already own the source assignment. Only a verified
  `offplan_buyer` request stamped by the separate checked intake can qualify.
  New conversion needs `in_progress` plus purchase/viewing intent; a missing
  physical-unit bridge, document request, or unverified project only remains an
  inquiry on the source screen.
- The server reads exact published project, catalog unit and physical property,
  and requires that physical property to belong to the selected company and
  appear in that exact enforced-space result. No role inferred from browser
  selections and no destination/agent override.
- The deal receives only a fixed title, direct property/project references, and
  one internal generic activity. No buyer name, phone, email, CRM contact,
  private notes, exact intent, message, unconfirmed offer, amount, booking, hold,
  or payment. Unit and intent remain on the original restricted request.
- A row lock serializes conversion and returns an existing deal only if the
  currently authorized company and physical/project context match. No status
  rewrite; order linkage untouched. A mismatched historical link is retriage,
  never create another deal. Rollback revokes only the new function access.

## Activation blockers
Check live storage, procedures, grants/policies/triggers and exact effective
scope implementation in the actual production project; generated types do not
even list the existing migration's converted_deal_id/converted_at fields.
The separate off-plan checked intake key/guard must be active and attest source
records. Verify all authorized ordinal callers and legacy converter behavior;
ensure no ordinary actor can overwrite/clear a checked source's conversion
link, and verify that generic conversion cannot create a second off-plan deal
or return a different company's detail for the same row. This candidate does
not alter the legacy global converter or its existing permissions, and cannot
certify its behavior or historical data.
The older CRM read policy uses `mc_can_access` (a company module check), not a
verified space/object-scoped deal disclosure boundary. Confirm authorized
readers, dependencies, internal detail linking and trigger destinations before
any enabled conversion, even for generic project references. Do not copy buyer
contacts into CRM without explicit entitlement and audited destination
visibility. Verify actor revocation, native parallel connections and no outbound
effects, then request separate activation/release. No live write was attempted.

## Evidence
Canonical source at pavel949/myuno 68341d61: operational resolver
`drizzle/migrations/0022_operating_scope_resolver.sql`; membership/CRM access
`supabase/migrations/20260312160000_fix_mc_can_access_owner.sql` and
`20260301040030_79529c97-8b40-4188-99e4-11c6a78752db.sql`; CRM bridge
`20260312000000_lead_to_deal_conversion.sql`,
`20260622000100_convert_lead_to_deal_rpc.sql`; deal project FK
`20260415120000_crm_mc_audit_permissions_project.sql`.

Run synthetic SQL: `node --test crm.test.mjs` with `@electric-sql/pglite@0.5.17`
in an isolated dependency path. The fixture uses deliberately minimal
projection/actor/scope stubs, not a native production schema clone.
