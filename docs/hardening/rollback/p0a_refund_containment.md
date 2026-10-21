# P0-A refund containment rollback

Security-preserving rollback is to disable automatic refund dispatch or retain the deployed read-only containment handler. Never restore the previous `stripe_payment_intent_id` lookup, manual-success marker, unconditional Stripe refund or order-only reversal.

There is no database migration or business DML in this change. Do not repair historical refunds through this rollback. Restore automated refunds only after an independently reviewed actor/payment/refund/ledger transaction contract and isolated replay/failure tests pass.

The signed transfer reject caller is not certified: it still cancels before invoking refund and can report rejection success with a refund error. The containment endpoint cannot correct that previous mutation; it does prevent additional money movement and false refund completion.