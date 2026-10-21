-- Read-only guest contract. No business-row, private authority or enforcement changes.
CREATE VIEW public.public_room_category_catalog WITH (security_barrier=true) AS
SELECT c.id,c.property_id,c.name_en,c.name_ru,c.base_price_per_night,
 c.min_stay_nights,c.max_guests,c.is_active,c.sort_order
FROM public.property_room_categories c
JOIN public.public_property_catalog p ON p.id=c.property_id
WHERE c.is_active IS TRUE;
REVOKE ALL ON public.public_room_category_catalog FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.public_room_category_catalog TO anon,authenticated,service_role;

CREATE VIEW public.public_room_rate_plan_catalog WITH (security_barrier=true) AS
SELECT r.id,r.category_id,r.name_en,r.name_ru,r.adjustment_type,r.adjustment_value,
 r.is_refundable,r.free_cancellation_days,r.min_stay_nights,r.max_stay_nights,
 r.min_advance_days,r.is_active
FROM public.property_rate_plans r
JOIN public.public_room_category_catalog c ON c.id=r.category_id
WHERE r.is_active IS TRUE;
REVOKE ALL ON public.public_room_rate_plan_catalog FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.public_room_rate_plan_catalog TO anon,authenticated,service_role;

CREATE VIEW public.public_room_rate_season_catalog WITH (security_barrier=true) AS
SELECT s.category_id,s.start_date,s.end_date,s.nightly_rate,s.min_stay_nights,s.is_active
FROM public.property_rate_seasons s
JOIN public.public_room_category_catalog c ON c.id=s.category_id AND c.property_id=s.property_id
WHERE s.is_active IS TRUE AND s.currency='THB';
REVOKE ALL ON public.public_room_rate_season_catalog FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.public_room_rate_season_catalog TO anon,authenticated,service_role;

CREATE VIEW public.public_room_stay_rule_catalog WITH (security_barrier=true) AS
SELECT r.property_id,r.category_id,r.date,r.price_override,r.min_stay_nights,
 r.closed_to_arrival,r.closed_to_departure,r.stop_sell
FROM public.property_stay_restrictions r
JOIN public.public_property_catalog p ON p.id=r.property_id
WHERE r.category_id IS NULL OR EXISTS (
 SELECT 1 FROM public.public_room_category_catalog c
 WHERE c.id=r.category_id AND c.property_id=r.property_id);
REVOKE ALL ON public.public_room_stay_rule_catalog FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.public_room_stay_rule_catalog TO anon,authenticated,service_role;

COMMENT ON VIEW public.public_room_category_catalog IS 'Read-only active categories of approved active non-deleted public properties. No owner, room identity or operational fields.';
COMMENT ON VIEW public.public_room_rate_plan_catalog IS 'Guest-visible plan labels/cancellation and existing hotelQuote price inputs only. No default markers, timestamps or meal-plan disclosure.';
COMMENT ON VIEW public.public_room_rate_season_catalog IS 'Active matching category/property THB nightly seasons only. No owner, notes, discount/weekly/monthly configuration.';
COMMENT ON VIEW public.public_room_stay_rule_catalog IS 'Public property-wide or matching active-category date rules consumed by hotelQuote. No row identity, owner, timestamps or operational reasons.';

-- Preserve manager/owner/admin policies and restrictive operational ceilings.
-- Public full-row policies are replaced by the explicit projections above.
ALTER POLICY "Public read active categories" ON public.property_room_categories USING (false);
ALTER POLICY "Public read active rate plans" ON public.property_rate_plans USING (false);
ALTER POLICY "Public read active rate seasons of active properties" ON public.property_rate_seasons USING (false);
ALTER POLICY "Public read restrictions" ON public.property_stay_restrictions USING (false);

CREATE FUNCTION public.get_public_room_category_availability(_category_id uuid,_check_in date,_check_out date)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF _check_in IS NULL OR _check_out IS NULL OR NOT isfinite(_check_in) OR NOT isfinite(_check_out)
    OR _check_out <= _check_in THEN
   RAISE EXCEPTION 'Invalid stay dates' USING ERRCODE='22023';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.public_room_category_catalog WHERE id=_category_id) THEN
   RETURN NULL;
 END IF;
 RETURN public.get_category_availability(_category_id,_check_in,_check_out);
END;
$$;
REVOKE ALL ON FUNCTION public.get_public_room_category_availability(uuid,date,date) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_public_room_category_availability(uuid,date,date) TO anon,authenticated,service_role;
COMMENT ON FUNCTION public.get_public_room_category_availability(uuid,date,date) IS 'Public active approved category aggregate only; delegates existing canonical inventory predicate. No room/booking identities, reservation or money authority. Legacy helper privileges unchanged pending separate review.';