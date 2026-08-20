-- 1. MC members can read signers of their company's signature requests
CREATE POLICY "MC members view request signers"
ON public.signature_request_signers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.signature_requests sr
    JOIN public.management_company_members mcm ON mcm.company_id = sr.company_id
    WHERE sr.id = signature_request_signers.request_id
      AND mcm.user_id = auth.uid()
      AND mcm.is_active = true
  )
  OR public.is_admin_or_uno_team()
);

-- 2. Public property view must not expose owner_id (anon has no SELECT on that column,
--    which made every anonymous read fail with "permission denied for table properties")
DROP VIEW IF EXISTS public.v_properties_public;
CREATE VIEW public.v_properties_public
WITH (security_invoker = on) AS
  SELECT id, title_en, title_ru, description_en, description_ru,
         price, sale_price, currency, property_type, listing_type,
         bedrooms, bathrooms, area_sqm, lat, lng, address, district,
         images, cover_image, amenities, is_active, approval_status,
         created_at, updated_at, management_company_id, max_guests,
         check_in_time, check_out_time
    FROM public.properties
   WHERE is_active = true AND approval_status = 'approved';

GRANT SELECT ON public.v_properties_public TO anon, authenticated;
GRANT ALL ON public.v_properties_public TO service_role;

-- 3. Owner-scoped views are never legitimately readable anonymously
REVOKE SELECT ON public.v_owner_properties FROM anon;
REVOKE SELECT ON public.owner_properties FROM anon;
REVOKE SELECT ON public.v_owner_profitability FROM anon;