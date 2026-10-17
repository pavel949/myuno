-- E2.7: authenticated users read approved listings only through the allowlisted catalog projection.
-- Private PMS reads stay on public.properties under the existing object-scoped policies
-- (owner, provider, assigned manager, company staff, admin) plus the operating-space ceiling.
-- No enforcement activation, no spaces/assignments/members, no data changes.

-- 1. Catalog projection = existing allowlist + the columns anon was already granted (public contract).
--    Columns are appended so CREATE OR REPLACE keeps dependent order; no private column is added.
CREATE OR REPLACE VIEW public.public_property_catalog WITH (security_barrier=true) AS
SELECT id, location_id, project_id, complex_id, title_en, title_ru, title, description_en, description_ru, property_type,
 listing_type, listing_modes, price, price_period, price_per_night, currency, sale_price, sale_currency, is_for_sale,
 bedrooms, bathrooms, rooms, beds, area_sqm, plot_size_sqm, max_guests, amenities, highlights, images, cover_image,
 video_url, lat, lng, district, building_name, view_type, furnishing_level, floor, total_floors, pool_type, pool_size,
 garden_type, has_elevator, parking_spaces, parking_type, pets_allowed, children_friendly, smoking_policy,
 parties_allowed, check_in_time, check_out_time, min_stay_nights, instant_booking, house_rules, house_rules_ru,
 cancellation_policy, host_languages, nearby_places, is_featured, is_verified, rating, review_count, available_from,
 created_at, updated_at,
 provider_id, address, is_active, unit_number, equipment, approval_status, ownership_form, ownership_type, status,
 deposit_amount, deposit_currency, deposit_type, weekly_discount, monthly_discount, seasonal_pricing,
 electricity_included, water_included, included_services, extra_services, cleaning_included, cleaning_frequency,
 pet_policy, wifi_included, wifi_speed, building_year, quiet_hours_start, quiet_hours_end, max_party_guests,
 internet_speed, transfer_available, transfer_airport_price, transfer_notes, transfer_notes_ru, extra_guest_price,
 extra_guest_threshold, parking_included, parking_notes, pet_notes, pet_notes_ru, has_crib, has_high_chair,
 safety_features, accessibility_features, payment_model, management_company_id, marketplace_property_id, approved_at,
 instant_booking_enabled_at, pm_company_id, early_booking_discount, early_booking_days, last_minute_discount,
 last_minute_days, payment_policy, custom_length_discounts, asset_class, floor_area_sqm, land_size_sqm, land_size_rai,
 frontage_m, road_access, zoning, title_deed_type, electricity_load_kw, water_supply, cap_rate_pct, yield_pct,
 permitted_uses, building_condition, hotel_keys, hotel_star_rating, hotel_brand, hotel_license_type,
 hotel_year_renovated, tenancy_modes, price_per_month, price_per_year, deposit_months_long, advance_months_long,
 min_lease_months, utilities_included_long, tm30_registration_supported, sale_intent, is_assignment, is_quick_sale,
 quick_sale_reason, quick_sale_discount_pct, urgency_deadline, accepts_installments, installment_plan, escrow_offered,
 escrow_provider, encumbrances_disclosed, foreign_quota_available, video_file_url, virtual_tour_url, clearview_badge,
 clearview_score, clearview_recommendation, clearview_synced_at, max_stay_nights, advance_notice_hours,
 preparation_days, booking_window_months
FROM public.properties
WHERE is_active IS TRUE AND approval_status='approved' AND deleted_at IS NULL;
GRANT SELECT ON public.public_property_catalog TO anon,authenticated,service_role;

-- 2. Booked guests read stay instructions for their own confirmed booking only.
CREATE OR REPLACE FUNCTION public.guest_stay_property_details(p_booking_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object(
    'id',p.id,'title',p.title,'title_ru',p.title_ru,'address',p.address,'district',p.district,'images',p.images,
    'check_in_time',p.check_in_time,'check_out_time',p.check_out_time,
    'check_in_instructions',p.check_in_instructions,'check_in_instructions_ru',p.check_in_instructions_ru,
    'key_handover',p.key_handover,'manager_name',p.manager_name,'manager_phone',p.manager_phone,
    'emergency_contact_name',p.emergency_contact_name,'emergency_contact_phone',p.emergency_contact_phone,
    'house_rules',p.house_rules,'house_rules_ru',p.house_rules_ru)
  FROM public.property_bookings b JOIN public.properties p ON p.id=b.property_id
  WHERE b.id=p_booking_id AND auth.uid() IS NOT NULL AND b.guest_id=auth.uid()
    AND b.status IN ('confirmed','checked_in') AND p.deleted_at IS NULL
$$;
REVOKE ALL ON FUNCTION public.guest_stay_property_details(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.guest_stay_property_details(uuid) TO authenticated,service_role;

-- 3. Close the authenticated approved-row branch on the base table (anon keeps column-granted access).
ALTER POLICY public_view_active ON public.properties TO anon;
ALTER POLICY "Anyone can view approved properties or own content" ON public.properties TO authenticated
  USING (EXISTS (SELECT 1 FROM public.providers WHERE providers.id=properties.provider_id AND providers.user_id=auth.uid()));
