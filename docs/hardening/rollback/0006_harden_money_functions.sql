-- One-step rollback for drizzle/migrations/0006_harden_money_functions_and_provider_org_links.sql
GRANT EXECUTE ON FUNCTION public.record_ledger_entries(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.credit_cashback(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_payout(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_with_wallet_payment(uuid, text, timestamptz, numeric, text, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(text, uuid, uuid, timestamptz, timestamptz, numeric, text, text, jsonb, jsonb, jsonb, jsonb, text, numeric) TO authenticated;
DROP TRIGGER IF EXISTS trg_guard_customer_order_update ON public.orders;
-- Frontend: revert useAdminPayouts -> 'process_payout', useOrders -> 'create_order_atomic'.
-- Wrappers (admin_process_payout, create_order_checked) and provider_org_links may stay; they are additive.
