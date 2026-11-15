-- Fail closed: retain immutable fields and financial boundaries, stop mutations.
BEGIN;
REVOKE INSERT,UPDATE,DELETE ON public.orders,public.order_items,public.order_participants,public.order_addresses,
 public.payment_intents,public.ledger_entries FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.create_order_checked(text,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric,uuid)
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.create_managed_property_booking_checked(jsonb) FROM PUBLIC,anon,authenticated;
COMMIT;
