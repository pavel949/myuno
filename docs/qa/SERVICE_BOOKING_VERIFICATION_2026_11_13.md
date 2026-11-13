# Service booking verification — 2026-11-13

## Verdict and boundaries

**Scheduled Marketplace request flow PASS in isolation; live end-to-end booking readiness BLOCKED/unverified.** A sent request is not provider confirmation, capacity guarantee or payment.

Initial source HEAD: `4d23e3df7ea92e77f44f4bc19ab32ba324f35f67`. Read PROJECT.md, AGENTS.md and supervised execution boundaries. No application code changes, production requests/orders/guest writes, notifications, payments, migrations, settings, deployment or publication. Runtime fixture uses an authenticated synthetic actor and the real ServiceBookingSheet, useCreateServiceOrder and useGuestServiceOrders, with an in-memory client. It is not live E2E.

## Scenario matrix

| UI → hook/request → data/authorization → result | Outcome | Evidence/limit |
| --- | --- | --- |
| Catalogue/provider detail → safe public projections → offering → booking sheet | PASS isolated | Existing provider scheduling and route tests passed; nondefault duration/lead time, unknown price and explicit currency preserved. |
| Sheet → provider hours/busy helper → Phuket civil schedule → available time | PASS selected | Pure slots tests and actual sheet fixture. No production busy-slot query or working-hours read. |
| Submit → useCreateServiceOrder → synthetic service_orders pending row → persisted ID | PASS isolated | Actual writer payload includes service/provider/guest/schedule, not client amount/payment status. Authenticated synthetic actor only. |
| SLOT_TAKEN → form error → different time → second submission | PASS browser | Desktop 1280×1800 and mobile 375×1800: first synthetic insert rejected, second accepted; name retained, confirmation visible. |
| Receipt → guest-service-orders invalidation → mounted reader → pending row | PASS browser/hooks | Synthetic-order:pending reads back; original-actor invalidation and no other-actor invalidation covered by hook tests. |
| Customer tracking → /bookings service section → pending confirmation label | PASS isolated tests | BookingTrackingOverview tests; browser read-back uses real reader with a minimal output, not the full Bookings page. |
| Pending cancellation → owned/status-filtered update → returned row → success | PASS unit | Zero rows, wrong ID/actor/status and denied updates never claim success. No real cancellation. |
| Missing/inactive/empty provider or ambiguous commercial org mapping → blocked form | PASS unit | ServiceBooking/catalogue/model tests. Mapping gate applies to commercial route, not valid request-only sheet. |
| Provider inbox → useProviderOrders → real request → acknowledgement/fulfilment | BLOCKED | Source traced; no real inbox, provider assignment or completion exercised. |
| Email/WhatsApp delivery | BLOCKED | No delivery test or outbound request. Marketplace creation hook does not itself dispatch a notice; other delivery machinery not recertified. |
| Actual deployed slot validation, RLS, concurrent inserts/idempotency | BLOCKED | Source migration inspected only; no isolated backend/SQL execution or production mutation. |
| All verticals / BOOK+PAY | NOT CERTIFIED | Airport transfer, yachts, tours, fitness and other commercial paths are not equivalent to request-only Marketplace; not submitted. |

## Fresh commands/results

```text
bun run test src/hooks/useServiceMarketplace.handoff.test.tsx src/hooks/useServiceOrders.test.tsx src/hooks/useServiceBookingCatalogue.test.ts src/lib/services/serviceBookingModel.test.ts src/lib/services/__tests__/slots.test.ts src/pages/services/ServiceBooking.test.tsx src/pages/services/ServiceProviderDetail.scheduling.test.tsx src/pages/services/ServiceRoutes.integration.test.tsx src/pages/services/ServiceFunctionOrder.clearance.test.tsx src/pages/services/ServiceFunctionOrder.accessibility.test.tsx src/components/services/__tests__/marketplaceUxStates.test.tsx src/lib/services/serviceRequestCopy.test.ts
bun run test src/components/bookings/BookingTrackingOverview.test.tsx src/hooks/__tests__/useMyRequests.test.tsx
PYTHONDONTWRITEBYTECODE=1 python3 /tmp/browser/service-booking/check_booking.py
```

**93/93 tests PASS across 14 files** (82 + 11). Browser: **2/2 complete isolated flows PASS**, each rejecting one slot and successfully saving/read-back of another. Four total synthetic insert attempts; zero production writes or notifications; zero final browser page errors. External network denied, application client intercepted before import. Temporary runner initially failed on Vite default-export/query-string module identity; corrected only the temporary runner, not application code. Final evidence `/tmp/browser/service-booking/results.json`, `run.log`, `375-confirmed.png`, `1280-slot-rejected.png`; both screenshots reviewed. Test logs `/tmp/service-booking-tests.log`, `/tmp/service-readback-tests.log`.

## Source-supported limitations

1. **Two different pathways:** scheduled Marketplace writes `service_orders` (`src/hooks/useServiceMarketplace.ts:102–136`). Function intake and legacy cart booking write commercial `orders` (`ServiceFunctionOrder.tsx:130–177`, `useBooking.ts:156–224`); do not certify them as the same reservation contract.
2. **Customer navigation:** `/bookings` renders service request tracking (`BookingTrackingOverview.tsx`); `/me/services` is catalogue discovery and `useMyRequests` does not aggregate `service_orders`. Confirmation has Done, but no direct tracking link. This is a navigation gap, not missing persistence.
3. **Missing working hours:** sheet cannot select a time and cannot submit; it instructs direct messaging. Whether real providers have hours is UNKNOWN here.
4. **Commercial legacy inputs:** serviceBookingModel still explicitly marks fixed time choices and 100 THB fee unresolved. Not authoritative live availability or approved tariff evidence.
5. **Server concurrency source gap:** `20260924114852_9a588fff-8d77-4585-99b8-21390f3cce73.sql:57–82` derives names/price/provider and checks past/conflicting time, but uses overlap IF EXISTS without demonstrated serialization/exclusion; working hours/lead time are not checked there. Later/deployed enforcement not audited, so no observed double-booking claim.
6. **Provider cache:** creator invalidates provider-busy and guest-service-orders, not provider-service-orders; provider inbox refresh path not demonstrated in this check.

Recommendation: treat the verified sheet as a request requiring provider confirmation, not an instantly confirmed booking; next verify a contained request→provider inbox→customer status/delivery path and clarify the tracking destination. This report does not authorize activation or live test records.

Repository changes: this report and roadmap only. Application behavior unchanged; real hosted E2E and server enforcement remain unverified.