# Rollback 0011 / 0012 (2026-10-07)

- 0011 `calculate_order_commission`: percent rules (10.00) are now divided by 100; rate clamped to [0,1].
  Rollback: restore the previous body from migration history (rate used as-is). Not recommended — it makes every new order fail `trg_validate_order_fee`.
- 0012 `trg_sync_order_to_property_booking`: guest from `primary` or `guest` participant, guests from `metadata.guests`, deposit copied.
  Rollback: restore previous body (role='guest' only, `guests_count` only, no deposit).
- Edge `create-property-deposit-checkout`: removed non-existent `properties.cleaning_fee` from select, removed `product_id` (FK to products), added `property_id` to item metadata. Rollback: redeploy previous commit.
