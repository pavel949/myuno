-- ============================================================
-- P0 Security Fixes (4 ERRORs) — pre-launch hardening
-- ============================================================

-- P0-3. Storage buckets ---------------------------------------
DROP POLICY IF EXISTS "Service role can update property images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update reports"        ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload reports"        ON storage.objects;

CREATE POLICY "service_role writes property-images"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'property-images');
CREATE POLICY "service_role updates property-images"
  ON storage.objects FOR UPDATE TO service_role
  USING (bucket_id = 'property-images')
  WITH CHECK (bucket_id = 'property-images');
CREATE POLICY "authenticated upload own property-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
CREATE POLICY "authenticated update own property-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
CREATE POLICY "authenticated delete own property-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "service_role writes property-reports"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'property-reports');
CREATE POLICY "service_role updates property-reports"
  ON storage.objects FOR UPDATE TO service_role
  USING (bucket_id = 'property-reports')
  WITH CHECK (bucket_id = 'property-reports');

-- P0-1. properties — column-level GRANT for anon -------------
REVOKE SELECT ON public.properties FROM anon;

GRANT SELECT (
  id, provider_id, location_id,
  title, title_en, title_ru, description_en, description_ru,
  property_type, listing_type, asset_class,
  price, price_period, currency, price_per_night, price_per_month, price_per_year,
  sale_price, sale_currency, is_for_sale, sale_intent,
  bedrooms, bathrooms, rooms, beds, area_sqm, floor_area_sqm, land_size_sqm, land_size_rai,
  max_guests, amenities, images, cover_image, video_url, video_file_url, virtual_tour_url,
  lat, lng, address, district,
  is_active, is_featured, is_verified, approval_status, status,
  available_from, min_stay_nights, min_lease_months,
  rating, review_count,
  created_at, updated_at, approved_at,
  instant_booking, instant_booking_enabled_at,
  project_id, floor, unit_number, view_type, furnishing_level, equipment,
  highlights, listing_modes, tenancy_modes,
  weekly_discount, monthly_discount, seasonal_pricing,
  early_booking_discount, early_booking_days, last_minute_discount, last_minute_days,
  custom_length_discounts,
  check_in_time, check_out_time, house_rules, house_rules_ru,
  cancellation_policy, payment_policy, payment_model,
  electricity_included, water_included, wifi_included, wifi_speed,
  included_services, extra_services, cleaning_included, cleaning_frequency,
  pool_size, pool_type, garden_type,
  parking_spaces, parking_type, parking_included, parking_notes,
  pet_policy, pets_allowed, pet_notes, pet_notes_ru,
  smoking_policy, children_friendly, has_crib, has_high_chair,
  parties_allowed, max_party_guests, quiet_hours_start, quiet_hours_end,
  building_name, building_year, total_floors, has_elevator, building_condition,
  internet_speed,
  transfer_available, transfer_airport_price, transfer_notes, transfer_notes_ru,
  extra_guest_price, extra_guest_threshold,
  host_languages, nearby_places, safety_features, accessibility_features,
  management_company_id, complex_id, pm_company_id,
  road_access, zoning, frontage_m, title_deed_type,
  electricity_load_kw, water_supply, permitted_uses,
  hotel_keys, hotel_star_rating, hotel_brand, hotel_license_type, hotel_year_renovated,
  deposit_amount, deposit_currency, deposit_type,
  deposit_months_long, advance_months_long, utilities_included_long,
  tm30_registration_supported,
  is_assignment, is_quick_sale, quick_sale_reason, quick_sale_discount_pct,
  urgency_deadline, accepts_installments, installment_plan,
  escrow_offered, escrow_provider, foreign_quota_available,
  encumbrances_disclosed,
  yield_pct, cap_rate_pct,
  clearview_badge, clearview_score, clearview_recommendation, clearview_synced_at,
  marketplace_property_id, ownership_form, ownership_type
) ON public.properties TO anon;

GRANT SELECT ON public.properties TO authenticated;

-- P0-2. property_guidebook — drop email-join policy ----------
DROP POLICY IF EXISTS "Users with bookings can view guidebook" ON public.property_guidebook;

CREATE POLICY "Guests view guidebook via user_id"
  ON public.property_guidebook FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.property_bookings pb
      WHERE pb.property_id = property_guidebook.property_id
        AND pb.guest_id = auth.uid()
        AND pb.status IN ('confirmed','checked_in')
        AND pb.check_out >= CURRENT_DATE
    )
    OR EXISTS (
      SELECT 1 FROM public.guest_check_in_data gc
      JOIN public.property_bookings pb ON gc.booking_id = pb.id
      WHERE pb.property_id = property_guidebook.property_id
        AND gc.user_id = auth.uid()
        AND pb.check_out >= CURRENT_DATE
    )
  );

CREATE POLICY "Owners view their guidebook"
  ON public.property_guidebook FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_guidebook.property_id
        AND p.owner_id = auth.uid()
    )
  );

-- P0-4. crm_email_accounts — column-level GRANT --------------
REVOKE SELECT ON public.crm_email_accounts FROM authenticated;

GRANT SELECT (
  id, user_id, company_id, provider, email, display_name,
  token_expires_at, scopes, is_active, last_sync_at,
  sync_status, sync_error, created_at, updated_at
) ON public.crm_email_accounts TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.crm_email_accounts TO authenticated;
GRANT ALL ON public.crm_email_accounts TO service_role;