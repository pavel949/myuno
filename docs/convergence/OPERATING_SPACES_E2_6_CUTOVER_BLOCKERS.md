# Operating Spaces E2.6 — cutover blockers

Baseline `1b50480a0100936d0f2f6e6dd14d9ab6d3620ac8`. Forward migration `drizzle/migrations/0024_operating_cutover_blockers.sql`
(byte-identical to the isolated-tested SQL). Rollback `docs/hardening/rollback/0024_operating_cutover_blockers.sql`.
No enforcement enabled, no seed, no production business writes, no edge functions changed.
Authority: OPERATING_SPACES_DESIGN, GAP_AUDIT, E1, E2, E2.5 SECURITY, MANAGER_SCOPE_BYPASS_REGISTER.

All new ceilings are RESTRICTIVE and conditional: transparent when `operating_spaces_enforced=false`.
"Space-limited" (`actor_is_space_limited`) = member or `uno_team` of an enforced company who is not a company overseer.
Customers/owners/public who are not company members are not narrowed.

## Blocker dispositions

| Blocker | Disposition |
|---|---|
| A Property insert/onboarding | `create_managed_property_checked` (actor = `auth.uid()`, active director/admin/manager or overseer, `mc_can_access(properties,edit)`); enforced company always requires an active, same-company, actor-accessible space (overseers included — no unassigned onboarding); property + assignment in one transaction, created inactive. Direct authenticated INSERT with an enforced `management_company_id` denied by `operating_space_property_insert_ceiling`; personal/owner/provider inserts (null company) and legacy companies unchanged. |
| A Reassignment | `reassign_property_operating_space` — overseer only, same-company active target, non-empty reason. Every `operating_space_properties` change audited by trigger into `operating_space_assignment_audit` (overseer-readable). |
| B Backups | Bucket `mc-backups` (private). Live permissive "MC members can read own backups" let any active member read company backups. Added restrictive `operating_space_backup_ceiling` on `storage.objects`: enforced company → overseers only. Generation (service role, secret) unchanged. |
| C Sibling tables | See coverage table. |
| D Public projection | Added `public_property_catalog` (allowlisted marketing columns, approved+active+not deleted, anon SELECT). **Base-table anon access NOT revoked**: public consumers not yet migrated, so compatibility unproven (stop condition). Remains an E3 blocker. |
| E Governance | Restrictive write ceilings on `property_manager_assignments`, `property_delegates` (insert/delete), `team_member_permissions`: in enforced companies only overseers (or a non-member property owner for assignments/delegates). Removes generic `uno_team`/`staff` role bypass and member self-grant. |
| F Direct IDs | Tested per table: resort member cannot read/update/insert condo rows by explicit ID, and vice versa. |
| G Legacy | Test proves every new ceiling transparent with enforcement off. |

## Coverage (class 1 = property ceiling, 2 = company-global + capability, 3 = fail closed)

| Table | Class | Policy |
|---|---|---|
| property_financials, property_payout_rules, property_accounting_policies, property_rate_seasons, property_price_offers, property_documents, property_owners, property_activity_log, property_inquiries, owner_portal_settings, owner_statement_approvals, inventory_listings, property_delegates, property_manager_assignments | 1 | `operating_space_property_ceiling` (`actor_private_property_ceiling(property_id)`) |
| property_booking_status_history, booking_notifications_log | 1 via booking | `operating_space_booking_ceiling` |
| owner_invoices, owner_payouts, crm_tasks | 1 when property set; 3 when property null | `actor_company_property_ceiling`; also rejects company≠property company (0 live mismatches checked) |
| property_checklist_templates | 2 | reads unchanged; writes overseer-only when enforced |
| ledger_accounts, ledger_entries | 3 (no deterministic property link) | denied to space-limited actors in enforced companies |

## Public projection field contract
Included: identity, titles/descriptions, type/listing, prices/currency, sale fields, rooms/area/guests, amenities/highlights,
media, lat/lng, district, building_name, physical features, house policies, check-in/out times, min stay, instant booking,
cancellation policy, host languages, nearby places, rating/reviews, availability, timestamps.
Excluded (examples): owner_id, actual_owner_*, management_company_id, manager_*, emergency_*, lock_code, key_handover,
wifi_*, notes/internal_name, commission/purchase/mortgage/chanote, management documents, ical tokens, address.

## Unresolved (E3 blockers)
1. Public consumers still read base `properties`; migrate them to `public_property_catalog`, then revoke unsafe anon columns.
2. Ledger and null-property owner finance rows are fail-closed for space-limited users — finance module cannot be space-scoped until attribution exists.
3. `property_delegates` UPDATE (invite acceptance) left unchanged by design; owner-side flows not redesigned.
4. Hosted UI does not yet call `create_managed_property_checked`; enforced companies cannot onboard via the existing UI form until wired (fail closed).
5. Other company-only functions in the bypass register not covered here.

## Tests
`src/lib/__tests__/operatingSpaces.postgres.test.ts` + fixture `fixtures/operating-cutover-base.sql`: 68/68 (E1/E2/E2.5 + 26 new E2.6).
Combined with inventory and edge suites: 103/103. Isolated PostgreSQL only.

## Deployment evidence (read-only after apply)
enforced companies 0; spaces 0; assignments 0; members 0; audit rows 0; 46 `operating_space_*` policies;
anon cannot execute `create_managed_property_checked`; anon can read `public_property_catalog` (23 rows).

## Recommendation
**NO-GO for E3** until unresolved items 1 and 4 close; items 2–3 must be accepted explicitly for the first integrated modules.
