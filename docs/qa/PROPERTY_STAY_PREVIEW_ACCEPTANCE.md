# Unit stay preview acceptance (isolated frontend)

The property detail booking card and the inquiry screen read existing dated
prices and active seasons before displaying a provisional unit estimate. They do
not change inventory, payment policy, Stripe, fee policy, category or published
prices. This change is not proof of a live quote.

Check on synthetic fixtures (desktop + mobile): single night and consecutive
range including checkout boundary; different base and custom prices; range
across Dec/Jan; a 2026 season does not recur in 2027; overlapping season
precedence; failed date read and failed season read; retry succeeds; a URL date
change cannot use its predecessor's total. Compare the displayed stay subtotal
on the card and the inquiry. Leave existing orders/holds untouched.

## Separate server acceptance gate

Before declaring the pipeline ready to charge money, require a strict server
quote from the same canonical inputs and a specified, deterministic order for
legacy rules, absolute seasons, dated overrides, and discounts. Server, guest
preview and checkout must agree on exact stay amount, cleaning/other nonoptional
fees, currency precision and eligible payment terms. No client-supplied total
may establish the amount. Check weekly/monthly boundaries (7/28), time-based
discount cutoffs in Asia/Bangkok, season dates and overlaps, nightly/total
rounding, blackout, per-date minimum, and stale quote after price change. For a
valid change show the updated amount and require the guest to accept it before
proceeding. Confirm existing accepted quotes/booking snapshots are unchanged
and availability is enforced by the actual hold/writer. Test without live
payments or real customer data.

The frontend tranche retains the existing discount combination and existing
payment behavior; host-policy and server parity beyond the above read path
are not claimed.
