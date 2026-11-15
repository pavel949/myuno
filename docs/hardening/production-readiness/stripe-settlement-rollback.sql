-- Stop settlement; never restore order-first writes or erase verified receipts.
BEGIN;
REVOKE ALL ON FUNCTION public.settle_stripe_order_checked(uuid,uuid,text,text,bigint,text)
  FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
