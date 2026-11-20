# Experience concierge request

Both public experience detail variants open one request-only form. Guests select a Bangkok civil date and party size before sign-in. The session draft stores those two fields by listing and the existing auth route opens the request on return. A signed-in guest reviews the details and explicitly submits. An editorial experience still has no implied price, slot, reservation or checkout.

A dedicated authenticated entry point writes to the existing consultation table and returns its canonical receipt. It assigns the authenticated actor on the server, receives the experience ID, date, guest count and locale, and returns the existing consultation UUID. That UUID is displayed on the receipt and in My requests. The customer view reads only the authenticated guest's `tour_booking` rows in `tours`. The existing consultation inbox remains the operator queue. Contacts stay within the myUNO intake.

## Release gate

On 2026-11-20 production did not admit `tour_booking`. The candidate adds a restricted admission path and an actor-scoped receipt key. Replaying unchanged details returns the same request ID. The legacy consultation writer and other request types retain their existing contract.

Before release, prove the forward SQL and existing consultation writer in an isolated database. Retain the original constraint expression, verify legacy types still work, and verify `tour_booking` is accepted only with `vertical_id = 'tours'`. Confirm the customer and authorized operator see the same UUID, selected date and guest count. An unrelated customer and a signed-out visitor must have no read access. Verify the live schema change by reading its catalog definition and make only a no-submit smoke check on production.

Run `rollback.sql` to pause new submissions and restore the prior client build when needed. Existing customer receipts and operator access remain available. The candidate stays outside automatic migrations until its controlled activation.
