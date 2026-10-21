# Resort data-entry UX — 2026-10-17

## Delivered
- Existing multi-unit feature flag retained; no flag/configuration writes.
- Property/category date-rule entry on Property Structure: civil date, configured date price, minimum nights, arrival/departure closures, stop sell.
- Existing restriction identity is read by property/category/date; saves update the persisted ID or insert a new row, and require a returned ID. The unique expression index `uq_stay_restrictions` already prevents duplicate scope/date rows; no new schema is needed.
- Failed saves retain the draft. Successful saves invalidate rule and guest-offer queries. Blank price/minimum clears the date override and falls back to existing configured rules.
- Guest detail mounts existing category offers with date/guest inputs. Quotes reuse hotelQuote and merge property/category rules; guest count is part of the cache key and availability errors are not misreported as zero inventory.

## Evidence and limitations
- 21 existing hotel quote/detail smoke tests passed.
- Isolated Playwright drove the actual Structure page, editor, persistence hook and offers using synthetic rows: insert → update → reopen → failed save retention; date price total changed from 9,000 to 10,500 and 11,000 THB; stop sell and capacity changes made the quote unavailable. Verified 375/390/430/1280 widths; zero browser errors and all external requests denied.
- Automatic build OK. Browser evidence lives under `/tmp/browser/resort-rules/` and is not production acceptance.
- Correction (2026-10-17): `information_schema.role_table_grants` was incomplete under the querying role. `pg_class.relacl` and `has_table_privilege` prove anon already had SELECT. The signed-in restrictive season ceiling and broad public base reads, not missing grants, required a safe public projection. See the contract below.
- No production business writes, permissions, migrations, financial contracts, room assignment, enforcement or E3 changes. No category/rate selection-to-payment wiring is claimed.

## Next boundary
The allowlisted public read contract is now applied; verify populated guest offers only after the team enters real categories/tariffs. Financial and supervised-live-acceptance blockers remain NO-GO.

## Public contract and applied boundary
Migration: `drizzle/migrations/0034_public_resort_catalog_projection.sql`; source SQL `docs/convergence/resort-public-projection.sql`; fail-closed rollback `docs/hardening/rollback/resort_public_projection.sql`.

| Projection | Allowed fields | Row contract |
| --- | --- | --- |
| public_room_category_catalog | id, property_id, name_en/name_ru, base_price_per_night, min_stay_nights, max_guests, is_active, sort_order | Active category joined to existing public_property_catalog: approved, active, not deleted parent |
| public_room_rate_plan_catalog | id, category_id, name_en/name_ru, adjustment_type/value, is_refundable, free_cancellation_days, min/max_stay_nights, min_advance_days, is_active | Active plan of visible active category |
| public_room_rate_season_catalog | category_id, start/end_date, nightly_rate, min_stay_nights, is_active | Active THB category season; category and season must share property |
| public_room_stay_rule_catalog | property_id, category_id, date, price_override, min_stay_nights, closed_to_arrival/departure, stop_sell | Public parent; property-wide or matching active category |

- Authority: existing 0016 category contract and hotelQuote consume these exact price/restriction inputs; 0026 public-property publication contract limits the new guest surface. The shared legacy is_property_bookable_active helper is not redefined.
- Owner-executed security-barrier views enforce explicit fields and publication joins independent of private RLS. SELECT only for anon/authenticated/service_role; no view write grants. The four public full-row SELECT policies are disabled; all private manager/owner/admin policies and the restrictive season ceiling remain unchanged.
- Excluded: owner/member/company operational identities, notes, rule row IDs/timestamps, room/booking/guest records, access instructions, contacts, default flags, unused meal_plan and seasonal discount/weekly/monthly settings. No financial authority or amount calculation changes.
- New get_public_room_category_availability validates finite ordered dates and visible public category before delegating the unchanged canonical inventory counter. Returns only integer/null, never room/booking identities; not a hold or payment guarantee.

### Verification / gate
- Six focused local PostgreSQL tests cover anonymous/signed-in/team publication scope, mismatched/inactive/non-THB seasons, scoped date rules, complete response privacy, no writes, retained private manager rights and aggregate boundary. Fifteen existing hotelQuote tests also pass.
- Real anonymous Data API SELECT against all four hosted projections succeeds without permission errors (currently empty); no business writes. Isolated browser uses actual RoomCategoryOffers with only projection/RPC reads; 11,000 THB inherited date quote and capacity rejection verified, 375px layout fits, no runtime errors. Automatic build OK.
- Before/after private policy hash: `880f366e8f43f325248f70e3aee76f8a`. Counts unchanged: properties 33; categories/plans/seasons/restrictions/spaces/members 0. Enforced companies 0. No assignments or flags modified.
- **GO:** limited public projection. **NO-GO:** populated production acceptance, money mutations and E3.

### Requires separate agreement (not changed)
- Legacy get_category_availability remains directly publicly executable for arbitrary category IDs. The new guest path is bounded, but the wrapper cannot remove the old endpoint's disclosure. Recommend a reviewed caller inventory/migration before restricting its execution; no private dependency permissions changed here.
- Meal-plan publication and extra tariff fields have no necessary guest-display evidence and remain excluded. Additional disclosure requires explicit agreement.