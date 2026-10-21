-- =========================================================
-- Sprint H · P0 Security Hotfix (column-name-corrected)
-- =========================================================

-- 1) investment_deals
DROP POLICY IF EXISTS "public can view published deals" ON public.investment_deals;

CREATE POLICY "authenticated can view published deals"
ON public.investment_deals
FOR SELECT
TO authenticated
USING (is_published = true);

DROP VIEW IF EXISTS public.investment_deals_public;
CREATE VIEW public.investment_deals_public AS
SELECT
  id,
  category,
  status,
  deal_intent,
  is_published,
  teaser_public,
  description_public,
  location_display,
  deal_stage,
  capital_range,
  deal_size_midpoint_usd,
  deal_structure,
  target_timeline_months,
  expected_irr,
  capital_sought_usd_min,
  capital_sought_usd_max,
  published_at,
  created_at,
  updated_at
FROM public.investment_deals
WHERE is_published = true;

GRANT SELECT ON public.investment_deals_public TO anon, authenticated;

COMMENT ON VIEW public.investment_deals_public IS
  'Public-safe projection of investment_deals — excludes submitter_* PII, *_private fields, documents_urls, admin_notes, probability_score, platform_fee_*, expected_value_usd. Use for anon catalog pages.';

-- 2) management_companies
DROP POLICY IF EXISTS "Anyone can view active management companies" ON public.management_companies;

CREATE POLICY "Members and admins can view their companies"
ON public.management_companies
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (
    EXISTS (
      SELECT 1 FROM public.management_company_members m
      WHERE m.company_id = management_companies.id
        AND m.user_id = auth.uid()
        AND m.is_active = true
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'uno_team'::app_role)
  )
);

DROP VIEW IF EXISTS public.management_companies_public;
CREATE VIEW public.management_companies_public AS
SELECT
  id,
  slug,
  name_en,
  name_ru,
  description_en,
  description_ru,
  logo,
  cover_image,
  phone,
  email,
  whatsapp,
  website,
  address,
  district,
  languages,
  services,
  founded_year,
  properties_count,
  properties_managed,
  rating,
  review_count,
  is_verified,
  is_active,
  is_featured,
  brand_color,
  has_24_7_support,
  has_emergency_service,
  service_districts,
  service_types,
  created_at
FROM public.management_companies
WHERE is_active = true;

GRANT SELECT ON public.management_companies_public TO anon, authenticated;

COMMENT ON VIEW public.management_companies_public IS
  'Public-safe projection of management_companies — excludes bank_account, bank_name, swift_code, stripe_customer_id, stripe_subscription_id, legal_name, legal_address, registration_number, tax_id, license_number, dbd_card_url, documents, backup_settings, paid_slots, free_slots, verified_by, created_by, provider_id.';

-- 3) realtime_stats
DROP POLICY IF EXISTS "Authenticated update realtime stats" ON public.realtime_stats;
DROP POLICY IF EXISTS "Authenticated can update realtime stats" ON public.realtime_stats;

CREATE POLICY "Only admins can update realtime stats"
ON public.realtime_stats
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- 4) task_comments
DROP POLICY IF EXISTS "Users can view task comments" ON public.task_comments;

CREATE POLICY "Author or admin can view task comments"
ON public.task_comments
FOR SELECT
TO authenticated
USING (
  author_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- 5) webhook_endpoints
DROP POLICY IF EXISTS "MC members can view webhooks" ON public.webhook_endpoints;

CREATE POLICY "MC owners/admins can view webhooks"
ON public.webhook_endpoints
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = webhook_endpoints.company_id
      AND m.user_id = auth.uid()
      AND m.is_active = true
      AND m.role = ANY (ARRAY['owner','admin'])
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);
