# Experience concierge request

Both public experience detail variants open one request-only form. Guests select a Bangkok civil date and party size before sign-in. The session draft stores those two fields by listing and the existing auth route opens the request on return. A signed-in guest reviews the details and explicitly submits. An editorial experience still has no implied price, slot, reservation or checkout.

The existing consultation RPC owns the record. It assigns the authenticated actor on the server, receives the experience ID, date, guest count and locale, and returns the existing consultation UUID. That UUID is displayed on the receipt and in My requests. The customer view reads only the authenticated guest's `tour_booking` rows in `tours`. The existing consultation inbox remains the operator queue. Contacts stay within the myUNO intake.

## Release gate

On 2026-11-20 the working request-type constraint did not admit `tour_booking`. The existing live intake RPC derives `user_id` but does not recognize the retry key. The browser uses the existing conservative recovery mode and never retries an uncertain save in the same session.

Before release, prove the forward SQL and existing consultation writer in an isolated database. Retain the original constraint expression, verify legacy types still work, and verify `tour_booking` is accepted only with `vertical_id = 'tours'`. Confirm the customer and authorized operator see the same UUID, selected date and guest count. An unrelated customer and a signed-out visitor must have no read access. Verify the live schema change by reading its catalog definition and make only a no-submit smoke check on production.

Use an application rollback to pause the new entry point. The additive rule retains any real experience requests and allows the existing operator queue to process them. If no experience requests have been admitted, restoring the exact captured prior expression is a separate controlled database rollback.
