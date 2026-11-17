# Airport service requests · myUNO #235

## Supported routes and owners

| Entry | Supported flow | Writer |
| --- | --- | --- |
| `/transport/fast-track` | Phuket (HKT) arrival and departure, subject to offerings in the catalogue | `notify-fasttrack-booking` writes `airport_bookings` and `airport_passengers` and sends operations alerts |
| `/transport/airport-transfer` | HKT → a local address or a local address → HKT. One leg per order. The legacy `/airport-transfer` and `/transport/airport` entries redirect here. | `useOrders` → `create_order_checked` → `orders`. `notify-transfer-booking` handles offline methods. The existing Stripe webhook triggers the transfer notification for card payments. |
| `/transport/booking/:id` | Existing vehicle booking flow | Existing commercial transport order and related vehicle booking logic |
| `/discover/services`, `/services`, `/me/services` | Catalogue entry, dedicated routes and provider discovery | Catalogue reads |
| `/services/provider/:id`, `/services/booking/:id` | Provider offerings, including the provider request path | Provider request uses `useCreateServiceOrder` → `service_orders` with real service and provider IDs. The commercial path requires the existing organization mapping. |
| `/services/order/:functionId` | Static home functions such as cleaning and repairs | `useOrders` → `orders` with static function metadata and existing order/CRM alerts. These entries have no verified catalogue service/provider mapping for the existing `service_orders` writer. |

The transfer writer has one HKT endpoint, a local address and one scheduled timestamp. Airport-to-airport and round-trip routing are unavailable in this wizard. Vehicle catalogue data supplies passenger capacity. Luggage is validated as a count within the existing form limit. The catalogue supplies no per-vehicle luggage capacity. The Fast Track writer exposes an airport and flight direction, with no terminal field in its request contract.

## Frontend changes and validation

The airport forms use the same design-system frame, step indicator, and labeled inputs with associated validation errors. The static request form shares the contact field implementation. The transfer review shows the actual direction and local time. A failed rate read has its own retry state. The displayed Fast Track amounts use the offering currency, and itinerary requests are described as pending confirmation. A failed checkout initialization can retry the same order in the open form. Unknown order creation outcomes are flagged for checking My Bookings before attempting a new submission.

Run `npx vitest run src/lib/services src/pages/services --maxWorkers=2`, `node scripts/qa/fasttrack-booking-handler.mjs` and `node scripts/qa/transfer-operator-conflicts.mjs`. For the responsive browser fixture use `node scripts/qa/airport-request-ui.mjs` with Playwright Chromium installed. `CHROMIUM_PATH` can select an installed binary. The connected verification workflow uploads screenshots and results in its browser evidence artifact. The browser runs actual wizard components with synthetic catalogues and write endpoints, blocks external requests, and exercises 375/390/430/768/1440 px in a non-Phuket device timezone.

## Acceptance outstanding

- Verify the actual authenticated write, operator-facing request and notification delivery for each applicable path in an isolated backend. The browser recorder checks payloads and call counts only. Preview and production share business data, so use synthetic or isolated records.
- Provide durable server-side idempotency before certifying the no-duplicate requirement across refreshes, sessions and uncertain responses. The Fast Track endpoint inserts booking and passengers separately and presently returns success after a passenger write error. Treat atomicity and notification delivery as backend acceptance blockers.
- Resolve the canonical destination of static home-function requests with a verified catalogue mapping and existing CRM/status reconciliation before changing the writer.
- Complete RU/EN/TH and visual acceptance for the wider catalogue and remaining verticals. Some existing text in the airport flows still falls back to English in Thai.
- Public read-only HTTP attempts on the three entry paths returned redirects from `myuno.app` and timed out following `www.myuno.app` in this environment. Confirm the live routes separately.

## Compatibility recovery after PR #234 — 2026-11-17

Reconciled the three transport conflicts against the #234 acceptance head `8d0cd8ff08cf9c220d013c81a8c09390922d2171` and current main `d9bb2b9eb94f7a7c48cebb720ed8974fba287d2f` on the retained #236 branch. This recovery is not production activation.

- Vehicle selection preserves a restored value. The current vehicle/configured finite positive fare is checked through #234's readonly helper, including invalid multipliers and surcharge/total overflow. No THB 800 or default multiplier is restored.
- Unknown/loading rates remain explicit; vehicle progression cannot bypass the fare gate. Authentication resume retains #234's latest-handler validation and cancellation on unmount while preserving #236's submit lock and actor-bound retry of its existing pending checkout.
- #236's review omits passport values entirely; submission still includes the supplied passport at the existing boundary. Its configurable service cutoff is retained, strict invalid restored date/time blocks review submission, and submission rechecks the clock.
- Integration assertions follow the intentional #236 request labels, visible inline failure recovery and required receipt ID. They still verify no write on invalid state, full passport at the mocked submission boundary, no passport in review, no duplicate auth resume and current fare at submission. The clock case verifies the focused invalid date field after returning to the service step.
- Both isolated fixtures run: 12 responsive/recovery flows from #235 and 48 RU/EN booking review cases from #234. They use synthetic writes only. Radix resolution follows the repository shared alias contract.

Full hosted acceptance and backend notification/idempotency guarantees remain separate gates for any future recovery of #236; this compatibility commit does not reopen or merge it.

Recovery verification: 5,400 local tests passed in 470 files, including isolated PostgreSQL; TypeScript and production build passed; lint had zero errors. Both network-denying browser fixtures passed on the reconciled source (12 + 48 cases). These are local/synthetic results. A future reopened PR still requires hosted checks on its then-current head and no backend activation is implied.
