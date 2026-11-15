-- Containment rollback; preserve receipts, metadata and restrictive guards.
BEGIN;
-- Source: manual-request-rollback.sql
REVOKE ALL ON FUNCTION public.create_manual_property_request_atomic(uuid,uuid,text,uuid,timestamptz,timestamptz,numeric,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
-- Source: manual-receipts-rollback.sql
REVOKE ALL ON FUNCTION public.confirm_manual_receipt_checked(uuid,numeric,numeric,numeric,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
-- Preserve existing receipts, protected metadata, unique references and proof.
-- Source: stripe-settlement-rollback.sql
-- Stop settlement; never restore order-first writes or erase verified receipts.
REVOKE ALL ON FUNCTION public.settle_stripe_order_checked(uuid,uuid,text,text,bigint,text)
  FROM PUBLIC,anon,authenticated,service_role;
-- Source: managed-booking-rollback.sql
REVOKE ALL ON FUNCTION public.create_managed_property_booking_checked(jsonb) FROM PUBLIC,anon,authenticated;
-- Source: order-authority-rollback.sql
-- Fail closed: retain immutable fields and financial boundaries, stop mutations.
REVOKE INSERT,UPDATE,DELETE ON public.orders,public.order_items,public.order_participants,public.order_addresses,
 public.payment_intents,public.ledger_entries FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.create_order_checked(text,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric,uuid)
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.create_managed_property_booking_checked(jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric) FROM PUBLIC,anon,authenticated,service_role;
-- Retain recipient-binding containment during rollback; never restore broad staff writes.
REVOKE INSERT,UPDATE,DELETE,TRUNCATE ON public.provider_org_links FROM PUBLIC,anon,authenticated;
COMMIT;
