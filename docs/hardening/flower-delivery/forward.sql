BEGIN;
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE public.flower_delivery_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  request_key uuid NOT NULL,
  request jsonb NOT NULL,
  estimate jsonb,
  confirmed_quote jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','unavailable')),
  confirmed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, request_key)
);
ALTER TABLE public.flower_delivery_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.flower_delivery_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT (id,customer_id,request,estimate,confirmed_quote,status,confirmed_at,created_at)
  ON public.flower_delivery_requests TO authenticated;
CREATE POLICY flower_delivery_select ON public.flower_delivery_requests
  FOR SELECT TO authenticated USING (auth.uid() = customer_id OR public.has_role(auth.uid(),'admin'::public.app_role));

CREATE FUNCTION private.flower_delivery_price(items jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  product record;
  item jsonb;
  item_id uuid;
  size_code text;
  qty integer;
  shop uuid;
  fee numeric := 0;
  subtotal numeric := 0;
  unit_price numeric;
  match_count integer;
  lines jsonb := '[]'::jsonb;
BEGIN
  FOR item IN SELECT value FROM pg_catalog.jsonb_array_elements(items) LOOP
    item_id := (item->>'bouquet_id')::uuid;
    size_code := item->>'size';
    qty := (item->>'quantity')::integer;
    SELECT b.id,b.shop_id,b.name_en,b.name_ru,b.price,b.size_variants,s.delivery_fee,
      b.currency,b.stock_quantity
    INTO product
    FROM public.bouquets b JOIN public.flower_shops s ON s.id = b.shop_id
    WHERE b.id = item_id AND b.is_active IS TRUE AND b.approval_status = 'approved'
      AND s.is_active IS TRUE AND s.approval_status = 'approved'
      AND s.delivery_available IS TRUE AND b.currency = 'THB'
    FOR SHARE OF b,s;
    IF NOT FOUND OR (shop IS NOT NULL AND shop <> product.shop_id)
       OR NOT (product.delivery_fee BETWEEN 0 AND 1000000)
       OR product.delivery_fee IS NULL
       OR (product.stock_quantity IS NOT NULL AND product.stock_quantity < qty) THEN
      RETURN NULL;
    END IF;
    shop := product.shop_id;
    fee := pg_catalog.round(product.delivery_fee,2);
    unit_price := NULL;
    IF size_code IS NULL THEN
      unit_price := product.price;
    ELSIF pg_catalog.jsonb_typeof(product.size_variants) = 'array'
      AND pg_catalog.jsonb_array_length(product.size_variants) > 0 THEN
      SELECT count(*), min((v->>'price')::numeric) FILTER (WHERE pg_catalog.jsonb_typeof(v->'price') = 'number')
        INTO match_count,unit_price
      FROM pg_catalog.jsonb_array_elements(product.size_variants) v WHERE v->>'size' = size_code;
      IF match_count <> 1 THEN RETURN NULL; END IF;
    ELSIF size_code = 'M' THEN
      unit_price := product.price;
    END IF;
    IF unit_price IS NULL OR NOT (unit_price > 0 AND unit_price <= 1000000) THEN RETURN NULL; END IF;
    unit_price := pg_catalog.round(unit_price,2);
    subtotal := subtotal + unit_price * qty;
    lines := lines || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
      'bouquet_id',product.id,'size',size_code,'quantity',qty,'name_en',product.name_en,
      'name_ru',product.name_ru,'unit_price',unit_price));
  END LOOP;
  IF EXISTS (SELECT 1 FROM public.flower_shops WHERE id = shop AND min_order_amount > subtotal) THEN RETURN NULL; END IF;
  RETURN pg_catalog.jsonb_build_object('currency','THB','subtotal',subtotal,'delivery_fee',fee,
    'total',subtotal+fee,'items',lines);
END;
$$;
REVOKE ALL ON FUNCTION private.flower_delivery_price(jsonb) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.request_flower_delivery(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  actor uuid := auth.uid();
  nonce uuid := (payload->>'request_key')::uuid;
  preferred_date date := (payload->>'date')::date;
  requested_slot text := payload->>'slot';
  items jsonb := payload->'items';
  recipient text := pg_catalog.btrim(payload->>'recipient');
  phone text := pg_catalog.btrim(payload->>'phone');
  address text := pg_catalog.btrim(payload->>'address');
  note text := pg_catalog.btrim(coalesce(payload->>'note',''));
  request_data jsonb;
  line jsonb;
  bouquet uuid;
  quantity integer;
  request_id uuid;
  existing jsonb;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'flower_auth_required' USING ERRCODE='42501'; END IF;
  IF nonce IS NULL OR preferred_date IS NULL OR NOT pg_catalog.isfinite(preferred_date)
       OR requested_slot IS NULL OR requested_slot NOT IN ('morning','afternoon','evening')
       OR pg_catalog.jsonb_typeof(items) IS DISTINCT FROM 'array'
       OR recipient IS NULL OR pg_catalog.char_length(recipient) NOT BETWEEN 1 AND 120
       OR phone IS NULL OR pg_catalog.char_length(phone) > 40
       OR pg_catalog.char_length(pg_catalog.regexp_replace(phone,'[^0-9]','','g')) NOT BETWEEN 7 AND 20
       OR address IS NULL OR pg_catalog.char_length(address) NOT BETWEEN 5 AND 500
       OR pg_catalog.char_length(note) > 500 THEN
    RAISE EXCEPTION 'flower_delivery_invalid' USING ERRCODE='22023';
  END IF;
  IF pg_catalog.jsonb_array_length(items) NOT BETWEEN 1 AND 10 THEN
    RAISE EXCEPTION 'flower_basket_invalid' USING ERRCODE='22023';
  END IF;
  FOR line IN SELECT value FROM pg_catalog.jsonb_array_elements(items) LOOP
    bouquet := (line->>'bouquet_id')::uuid;
    quantity := (line->>'quantity')::integer;
    IF bouquet IS NULL OR quantity IS NULL OR quantity NOT BETWEEN 1 AND 20
       OR coalesce(line->>'size','M') NOT IN ('S','M','L')
       OR NOT EXISTS (SELECT 1 FROM public.bouquets WHERE id=bouquet AND is_active IS TRUE) THEN
      RAISE EXCEPTION 'flower_basket_invalid' USING ERRCODE='22023';
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_catalog.jsonb_array_elements(items) v GROUP BY (v->>'bouquet_id')::uuid HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'flower_duplicate_bouquet' USING ERRCODE='22023';
  END IF;
  SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('bouquet_id',(v->>'bouquet_id')::uuid,
    'quantity',(v->>'quantity')::integer,'size',v->>'size') ORDER BY (v->>'bouquet_id')::uuid)
  INTO items FROM pg_catalog.jsonb_array_elements(items) v;
  request_data := pg_catalog.jsonb_build_object('items',items,'recipient',recipient,'phone',phone,
    'address',address,'date',preferred_date,'slot',requested_slot,'note',note);
  SELECT id,request INTO request_id,existing FROM public.flower_delivery_requests WHERE customer_id=actor AND request_key=nonce;
  IF FOUND THEN
    IF existing IS DISTINCT FROM request_data THEN RAISE EXCEPTION 'flower_request_key_conflict' USING ERRCODE='23505'; END IF;
    RETURN request_id;
  END IF;
  IF preferred_date < (pg_catalog.now() AT TIME ZONE 'Asia/Bangkok')::date THEN
    RAISE EXCEPTION 'flower_delivery_date_invalid' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.flower_delivery_requests(customer_id,request_key,request,estimate)
    VALUES (actor,nonce,request_data,private.flower_delivery_price(items))
    ON CONFLICT (customer_id,request_key) DO NOTHING RETURNING id INTO request_id;
  IF request_id IS NULL THEN
    SELECT id,request INTO STRICT request_id,existing
    FROM public.flower_delivery_requests WHERE customer_id=actor AND request_key=nonce;
    IF existing IS DISTINCT FROM request_data THEN RAISE EXCEPTION 'flower_request_key_conflict' USING ERRCODE='23505'; END IF;
  END IF;
  RETURN request_id;
END;
$$;
REVOKE ALL ON FUNCTION public.request_flower_delivery(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.request_flower_delivery(jsonb) TO authenticated;

CREATE FUNCTION public.review_flower_delivery(p_id uuid,p_confirm boolean,p_expected_quote jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  actor uuid := auth.uid();
  pending public.flower_delivery_requests%ROWTYPE;
  live_quote jsonb;
  window_end time;
BEGIN
  IF actor IS NULL OR NOT public.has_role(actor,'admin'::public.app_role) THEN
    RAISE EXCEPTION 'flower_review_forbidden' USING ERRCODE='42501';
  END IF;
  SELECT * INTO pending FROM public.flower_delivery_requests WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR pending.status <> 'pending' THEN
    RAISE EXCEPTION 'flower_request_not_pending' USING ERRCODE='22023';
  END IF;
  IF p_confirm IS FALSE THEN
    UPDATE public.flower_delivery_requests SET status='unavailable',confirmed_by=actor WHERE id=p_id;
    RETURN pg_catalog.jsonb_build_object('status','unavailable');
  END IF;
  IF p_confirm IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'flower_review_invalid' USING ERRCODE='22023'; END IF;
  window_end := CASE pending.request->>'slot' WHEN 'morning' THEN '12:00'::time
    WHEN 'afternoon' THEN '17:00'::time ELSE '21:00'::time END;
  IF (pending.request->>'date')::date + window_end <= (pg_catalog.now() AT TIME ZONE 'Asia/Bangkok') THEN
    RETURN pg_catalog.jsonb_build_object('status','expired');
  END IF;
  live_quote := private.flower_delivery_price(pending.request->'items');
  IF live_quote IS NULL OR live_quote IS DISTINCT FROM p_expected_quote THEN
    UPDATE public.flower_delivery_requests SET estimate=live_quote WHERE id=p_id;
    RETURN pg_catalog.jsonb_build_object('status',CASE WHEN live_quote IS NULL THEN 'quote_missing' ELSE 'quote_changed' END);
  END IF;
  UPDATE public.flower_delivery_requests SET status='confirmed',estimate=live_quote,
    confirmed_quote=live_quote,confirmed_by=actor,confirmed_at=pg_catalog.now() WHERE id=p_id;
  RETURN pg_catalog.jsonb_build_object('status','confirmed');
END;
$$;
REVOKE ALL ON FUNCTION public.review_flower_delivery(uuid,boolean,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.review_flower_delivery(uuid,boolean,jsonb) TO authenticated;

CREATE FUNCTION public.get_flower_delivery(p_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT pg_catalog.to_jsonb(r) FROM (
    SELECT id,request,estimate,confirmed_quote,status,confirmed_at
    FROM public.flower_delivery_requests WHERE id=p_id AND customer_id=auth.uid()
  ) r;
$$;
CREATE FUNCTION public.list_pending_flower_deliveries()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(r) ORDER BY r.created_at), '[]'::jsonb)
  FROM (
    SELECT id,request,estimate,confirmed_quote,status,confirmed_at,created_at
    FROM public.flower_delivery_requests WHERE status='pending'
      AND public.has_role(auth.uid(),'admin'::public.app_role)
    ORDER BY created_at,id LIMIT 50
  ) r;
$$;
REVOKE ALL ON FUNCTION public.get_flower_delivery(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.list_pending_flower_deliveries() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_flower_delivery(uuid),public.list_pending_flower_deliveries() TO authenticated;
COMMIT;
