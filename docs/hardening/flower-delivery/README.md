# Flower delivery confirmation

The customer requests a preferred Phuket time window and address. The operator sees the exact basket, destination and date under Operations → Flower delivery. They explicitly check fulfilment and confirm the amount they saw. The signed-in customer reads the same stored request and confirmed amount.

The database prices a single approved shop's bouquet selection and configured delivery fee in THB. Missing tariffs, unapproved stock, mixed shops and ambiguous sizes cannot be confirmed. Approval recalculates the entire quote and returns an updated estimate for another review if anything changed. The database rejects new flower orders unless the approved request, owner, address, window, currency and total match. This protects older checkout builds that create the order before opening payment. Existing orders remain readable and writable under their existing permission rules. The revised customer flow uses the confirmed quote for manual payment coordination.

On 20 November 2026 the linked production database contained 20 active bouquets with pending approval and zero active approved bouquets. An operator must review catalogue entries and validate delivery coverage, hours and stock before approval. No automatic approval, payment, reservation or availability claim is made by this change.

Run the schema change in a controlled activation. The rollback revokes request creation and review functions and preserves reads, confirmed quotes and order protection.
