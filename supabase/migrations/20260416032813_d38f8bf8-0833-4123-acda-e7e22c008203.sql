CREATE OR REPLACE VIEW public.v_properties_public
WITH (security_barrier = true)
AS
SELECT 
  id, title_en, title_ru, description_en, description_ru,
  price, sale_price, currency, property_type, listing_type,
  bedrooms, bathrooms, area_sqm, lat, lng, address,
  district,
  images, cover_image, amenities,
  is_active, approval_status, created_at, updated_at,
  owner_id, management_company_id,
  max_guests, check_in_time, check_out_time
FROM public.properties
WHERE is_active = true AND approval_status = 'approved';