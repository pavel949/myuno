-- Fail-closed rollback: disable browser mutation surfaces; never restore known bypasses.
REVOKE INSERT,UPDATE,DELETE ON public.orders, public.order_items, public.order_participants,
 public.order_addresses, public.payment_intents, public.ledger_entries, public.property_bookings FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.pay_from_wallet_atomic(uuid,numeric,text,text,text,text),
 public.topup_wallet_atomic(uuid,numeric,text,text) FROM PUBLIC,anon,authenticated;
-- Preserve service/internal checked workflows and the restrictive guard functions.