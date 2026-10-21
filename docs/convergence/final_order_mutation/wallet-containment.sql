-- Restrictive containment only. No data changes; no Operating Spaces activation.
DO $$ BEGIN
 IF md5(pg_get_functiondef('public.pay_from_wallet_atomic(uuid,numeric,text,text,text,text)'::regprocedure)) <> 'f164348167d6ae87350299ae5f75fa03'
 OR md5(pg_get_functiondef('public.topup_wallet_atomic(uuid,numeric,text,text)'::regprocedure)) <> 'de3fa2e4070c1ea477d12d2b41c14a7e'
 THEN RAISE EXCEPTION 'FINAL order mutation definition drift'; END IF;
END $$;

-- Arbitrary identity/amount wallet primitives are not customer refund/payment APIs.
REVOKE EXECUTE ON FUNCTION public.pay_from_wallet_atomic(uuid,numeric,text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.topup_wallet_atomic(uuid,numeric,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pay_from_wallet_atomic(uuid,numeric,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.topup_wallet_atomic(uuid,numeric,text,text) TO service_role;

-- Preserve function signatures and internal callers; reject nonfinite money before writes.
DO $$ DECLARE d text; BEGIN
 d:=pg_get_functiondef('public.pay_from_wallet_atomic(uuid,numeric,text,text,text,text)'::regprocedure);
 d:=replace(d, E'BEGIN\n', E'BEGIN\n  IF p_amount IS NULL OR p_amount <= 0 OR p_amount::text IN (''NaN'',''Infinity'',''-Infinity'') THEN RAISE EXCEPTION ''invalid_wallet_amount'' USING ERRCODE=''22023''; END IF;\n');
 EXECUTE d;
 d:=pg_get_functiondef('public.topup_wallet_atomic(uuid,numeric,text,text)'::regprocedure);
 d:=replace(d, E'BEGIN\n', E'BEGIN\n  IF p_amount IS NULL OR p_amount <= 0 OR p_amount::text IN (''NaN'',''Infinity'',''-Infinity'') THEN RAISE EXCEPTION ''invalid_wallet_amount'' USING ERRCODE=''22023''; END IF;\n');
 EXECUTE d;
END $$;

