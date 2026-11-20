-- Stop new requests and approvals. Preserve requests and customer visibility.
REVOKE EXECUTE ON FUNCTION public.request_flower_delivery(jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.review_flower_delivery(uuid,boolean,jsonb) FROM authenticated;
