
-- Step 1 of audit: fix 2 ERROR-level Security Definer Views
-- Recreate management_companies_public and investment_deals_public with security_invoker=on
-- so RLS runs as the caller (not view owner). Add anon-scoped policies + column-level
-- GRANTs on base tables so the views work for unauthenticated public marketplace usage
-- WITHOUT exposing sensitive columns (bank_account, swift_code, internal fields, etc).

-- ============================================================================
-- A. management_companies_public
-- ============================================================================
DROP VIEW IF EXISTS public.management_companies_public CASCADE;

CREATE VIEW public.management_companies_public
WITH (security_invoker = on) AS
SELECT
  id, slug, name_en, name_ru, description_en, description_ru,
  logo, cover_image, phone, email, whatsapp, website,
  address, district, languages, services,
  founded_year, properties_count, properties_managed,
  rating, review_count, is_verified, is_active, is_featured,
  brand_color, has_24_7_support, has_emergency_service,
  service_districts, service_types, created_at
FROM public.management_companies
WHERE is_active = true;

-- Anon public-read policy scoped to active companies only.
-- Column-level GRANT below ensures anon CANNOT read bank_account/swift_code/stripe_* even via base table.
DROP POLICY IF EXISTS "Anon can view active companies (public columns)" ON public.management_companies;
CREATE POLICY "Anon can view active companies (public columns)"
  ON public.management_companies
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Revoke broad SELECT, grant only safe columns to anon
REVOKE SELECT ON public.management_companies FROM anon;
GRANT SELECT (
  id, slug, name_en, name_ru, description_en, description_ru,
  logo, cover_image, phone, email, whatsapp, website,
  address, district, languages, services,
  founded_year, properties_count, properties_managed,
  rating, review_count, is_verified, is_active, is_featured,
  brand_color, has_24_7_support, has_emergency_service,
  service_districts, service_types, created_at
) ON public.management_companies TO anon;

GRANT SELECT ON public.management_companies_public TO anon, authenticated;

-- ============================================================================
-- B. investment_deals_public
-- ============================================================================
DROP VIEW IF EXISTS public.investment_deals_public CASCADE;

CREATE VIEW public.investment_deals_public
WITH (security_invoker = on) AS
SELECT
  id, category, status, deal_intent, is_published,
  teaser_public, description_public, location_display,
  deal_stage, capital_range, deal_size_midpoint_usd,
  deal_structure, target_timeline_months, expected_irr,
  capital_sought_usd_min, capital_sought_usd_max,
  published_at, created_at, updated_at
FROM public.investment_deals
WHERE is_published = true;

DROP POLICY IF EXISTS "Anon can view published deals (public columns)" ON public.investment_deals;
CREATE POLICY "Anon can view published deals (public columns)"
  ON public.investment_deals
  FOR SELECT
  TO anon
  USING (is_published = true);

REVOKE SELECT ON public.investment_deals FROM anon;
GRANT SELECT (
  id, category, status, deal_intent, is_published,
  teaser_public, description_public, location_display,
  deal_stage, capital_range, deal_size_midpoint_usd,
  deal_structure, target_timeline_months, expected_irr,
  capital_sought_usd_min, capital_sought_usd_max,
  published_at, created_at, updated_at
) ON public.investment_deals TO anon;

GRANT SELECT ON public.investment_deals_public TO anon, authenticated;
