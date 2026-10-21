-- Explicit calendar price edits over existing canonical rows. No new pricing
-- table, inventory mutation, assignment, approval or historical total change.
CREATE OR REPLACE FUNCTION public.set_property_calendar_price(
  p_property_id uuid, p_category_id uuid, p_from date, p_to date,
  p_price numeric, p_currency text, p_expected jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE actor uuid := auth.uid(); stored_currency text; stored_owner uuid; actual jsonb; d date; affected integer := 0;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_from >= p_to OR p_to - p_from > 366
    OR p_price IS NULL OR p_price::text IN ('NaN','Infinity','-Infinity') OR p_price <= 0 OR round(p_price,2) <> p_price
    OR p_expected IS NULL OR jsonb_typeof(p_expected) <> 'object'
    THEN RAISE EXCEPTION 'Invalid price or date range' USING ERRCODE='22023'; END IF;
  -- Price-only capability: live availability RLS is admin-only. Check the same
  -- hardened object authority and Operating Space ceiling explicitly; never
  -- grant callers generic availability UPDATE (which would expose occupancy).
  SELECT currency, owner_id INTO stored_currency, stored_owner FROM public.properties WHERE id=p_property_id FOR UPDATE;
  IF NOT FOUND OR public.can_manage_property_e28_private(p_property_id) IS NOT TRUE
    OR public.actor_private_property_ceiling(p_property_id) IS NOT TRUE
    THEN RAISE EXCEPTION 'Property pricing access required' USING ERRCODE='42501'; END IF;
  IF stored_currency IS NULL OR btrim(stored_currency)='' OR p_currency IS DISTINCT FROM stored_currency
    THEN RAISE EXCEPTION 'Reload the stored property currency' USING ERRCODE='40001'; END IF;

  IF p_category_id IS NOT NULL THEN
    PERFORM 1 FROM public.property_room_categories WHERE id=p_category_id AND property_id=p_property_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Category does not belong to property' USING ERRCODE='42501'; END IF;
    PERFORM 1 FROM public.property_stay_restrictions WHERE property_id=p_property_id AND category_id=p_category_id AND date>=p_from AND date<p_to FOR UPDATE;
    SELECT coalesce(jsonb_object_agg(date::text,jsonb_build_object('price',price_override,
      'minimum',min_stay_nights,'arrival',closed_to_arrival,'departure',closed_to_departure,'stop',stop_sell)), '{}'::jsonb)
    INTO actual FROM public.property_stay_restrictions
    WHERE property_id=p_property_id AND category_id=p_category_id AND date>=p_from AND date<p_to;
  ELSE
    PERFORM 1 FROM public.property_availability WHERE property_id=p_property_id AND date>=p_from AND date<p_to FOR UPDATE;
    SELECT coalesce(jsonb_object_agg(date::text,jsonb_build_object('price',price_override,
      'minimum',min_nights_override,'status',status,'booking',booking_id)), '{}'::jsonb)
    INTO actual FROM public.property_availability WHERE property_id=p_property_id AND date>=p_from AND date<p_to;
  END IF;
  IF actual IS DISTINCT FROM p_expected THEN RAISE EXCEPTION 'Prices changed; reload and review' USING ERRCODE='40001'; END IF;

  FOR d IN SELECT generate_series(p_from::timestamp,(p_to-1)::timestamp,interval '1 day')::date LOOP
    IF p_category_id IS NULL THEN
      IF actual ? d::text THEN
        UPDATE public.property_availability SET price_override=p_price WHERE property_id=p_property_id AND date=d;
      ELSE
        INSERT INTO public.property_availability(property_id,date,price_override,status)
          VALUES(p_property_id,d,p_price,'available') ON CONFLICT(property_id,date) DO NOTHING;
      END IF;
    ELSE
      IF actual ? d::text THEN
        UPDATE public.property_stay_restrictions SET price_override=p_price
          WHERE property_id=p_property_id AND category_id=p_category_id AND date=d;
      ELSE
        INSERT INTO public.property_stay_restrictions(property_id,category_id,date,price_override)
          VALUES(p_property_id,p_category_id,d,p_price)
          ON CONFLICT(property_id,(coalesce(category_id,'00000000-0000-0000-0000-000000000000'::uuid)),date) DO NOTHING;
      END IF;
    END IF;
    IF NOT FOUND THEN RAISE EXCEPTION 'Calendar changed; reload and review' USING ERRCODE='40001'; END IF;
    affected := affected+1;
  END LOOP;
  INSERT INTO public.property_activity_log(property_id,actor_id,actor_role,action,entity_type,entity_id,details)
    VALUES(p_property_id,actor,CASE WHEN stored_owner=actor THEN 'owner' ELSE 'manager' END,'price_override','property',p_property_id,
      jsonb_build_object('date_from',p_from,'date_to_exclusive',p_to,'category_id',p_category_id,
        'nightly_rate',p_price,'currency',stored_currency,'nights',affected,'before',actual));
  RETURN jsonb_build_object('property_id',p_property_id,'category_id',p_category_id,'nights',affected,'nightly_rate',p_price,'currency',stored_currency);
END $$;
REVOKE ALL ON FUNCTION public.set_property_calendar_price(uuid,uuid,date,date,numeric,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_property_calendar_price(uuid,uuid,date,date,numeric,text,jsonb) TO authenticated;
