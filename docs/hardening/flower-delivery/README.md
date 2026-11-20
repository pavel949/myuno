# Flower delivery confirmation

The customer requests a preferred Phuket time window and address. The operator sees the exact basket, destination and date under Operations → Flower delivery. They explicitly check fulfilment and confirm the amount they saw. The signed-in customer reads the same stored request and confirmed amount.

The database prices a single approved shop's bouquet selection and configured delivery fee in THB. No client-provided prices are used. Missing tariffs, unapproved stock, mixed shops and ambiguous sizes cannot be confirmed. Approval recalculates the entire quote and returns an updated estimate for another review if anything changed. The old card checkout entry point rejects requests before creating orders or Stripe sessions. The revised customer flow uses the confirmed quote for manual payment coordination.

On 20 November 2026 the linked production database contained 20 active bouquets with pending approval and zero active approved bouquets. An operator must review catalogue entries and validate delivery coverage, hours and stock before approval. No automatic approval, payment, reservation or availability claim is made by this change.

The schema change is held for controlled activation. The rollback revokes request creation and review functions and preserves reads and confirmed quotes. Keep the unchecked legacy payment path closed during rollback.
