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
