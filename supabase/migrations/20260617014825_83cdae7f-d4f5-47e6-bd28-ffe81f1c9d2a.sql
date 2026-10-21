
-- Step 3: column-level restriction on management_companies for authenticated members
-- Sensitive columns (bank_*, swift_code, stripe_*, tax_id, license_number, legal_*) accessible only via SECURITY DEFINER RPC

-- Revoke broad SELECT, regrant only safe columns to authenticated
REVOKE SELECT ON public.management_companies FROM authenticated;
GRANT SELECT (
  id, slug, name_en, name_ru, description_en, description_ru,
  logo, cover_image, phone, email, website, whatsapp,
  address, district, languages, services,
  founded_year, properties_count, properties_managed,
  rating, review_count, is_verified, is_active, is_featured,
  brand_color, has_24_7_support, has_emergency_service,
  service_districts, service_types,
  provider_id, default_commission_rate, min_contract_months,
  director_name, verified_at, verified_by,
  created_by, paid_slots, free_slots,
  created_at, updated_at, backup_settings
) ON public.management_companies TO authenticated;

-- service_role keeps full access (needed for edge functions)
GRANT ALL ON public.management_companies TO service_role;

-- INSERT/UPDATE/DELETE grants for authenticated (existing RLS policies will enforce row-level rules)
GRANT INSERT, UPDATE, DELETE ON public.management_companies TO authenticated;

-- RPC for sensitive fields: only company directors and platform admins
CREATE OR REPLACE FUNCTION public.get_management_company_sensitive(_company_id uuid)
RETURNS TABLE (
  id uuid,
  legal_name text,
  legal_address text,
  registration_number text,
  tax_id text,
  license_number text,
  bank_name text,
  bank_account text,
  swift_code text,
  stripe_customer_id text,
  stripe_subscription_id text,
  dbd_card_url text,
  documents jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'uno_team'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.management_company_members m
      WHERE m.company_id = _company_id
        AND m.user_id = auth.uid()
        AND m.is_active = true
        AND m.role = 'director'
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: director or admin role required';
  END IF;

  RETURN QUERY
  SELECT mc.id, mc.legal_name, mc.legal_address, mc.registration_number,
         mc.tax_id, mc.license_number, mc.bank_name, mc.bank_account,
         mc.swift_code, mc.stripe_customer_id, mc.stripe_subscription_id,
         mc.dbd_card_url, mc.documents
  FROM public.management_companies mc
  WHERE mc.id = _company_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_management_company_sensitive(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_management_company_sensitive(uuid) TO authenticated;
