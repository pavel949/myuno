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
- Hosted metadata read only: multi-unit flag enabled; restriction uniqueness exists; public read policies exist, but no anon table/column grants were returned for category/plan/season/restriction tables. Permission-denied category reads hide this optional section without privileged fallback. This is a public rollout blocker, not a claim of readiness.
- No production business writes, permissions, migrations, financial contracts, room assignment, enforcement or E3 changes. No category/rate selection-to-payment wiring is claimed.

## Next boundary
Recommend a separately reviewed, allowlisted public read contract before guest rollout; then verify using real categories/tariffs entered by the team. The existing gated financial and supervised-live-acceptance blockers remain NO-GO.