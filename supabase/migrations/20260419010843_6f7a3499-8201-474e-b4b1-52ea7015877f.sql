
-- Recreate view with security_invoker so it uses caller's RLS, not creator's
DROP VIEW IF EXISTS public.v_investment_deals_public;
CREATE VIEW public.v_investment_deals_public
WITH (security_invoker = on) AS
SELECT
  id, created_at, published_at,
  deal_intent, category, deal_stage,
  capital_range, deal_size_midpoint_usd,
  deal_structure, target_timeline_months, expected_irr,
  teaser_public, description_public, location_display,
  linked_developer_id, linked_property_id
FROM public.investment_deals
WHERE is_published = true;

GRANT SELECT ON public.v_investment_deals_public TO anon, authenticated;

-- Tighten INSERT policies (replace WITH CHECK (true) with sanity guards)
DROP POLICY IF EXISTS "anyone can submit investment deal" ON public.investment_deals;
CREATE POLICY "anyone can submit investment deal"
  ON public.investment_deals FOR INSERT
  WITH CHECK (
    submitter_email IS NOT NULL
    AND length(trim(submitter_email)) > 3
    AND submitter_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND submitter_name IS NOT NULL
    AND length(trim(submitter_name)) > 0
    AND title_private IS NOT NULL
    AND length(trim(title_private)) > 0
    -- Force-clear admin-only fields on insert (clients cannot set status/published)
    AND status = 'submitted'
    AND is_published = false
    AND admin_notes IS NULL
  );

DROP POLICY IF EXISTS "anyone can submit inquiry" ON public.investor_inquiries;
CREATE POLICY "anyone can submit inquiry"
  ON public.investor_inquiries FOR INSERT
  WITH CHECK (
    investor_email IS NOT NULL
    AND investor_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND investor_name IS NOT NULL
    AND length(trim(investor_name)) > 0
    AND status = 'new'
    AND admin_notes IS NULL
    AND EXISTS (
      SELECT 1 FROM public.investment_deals d
      WHERE d.id = investor_inquiries.deal_id
        AND d.is_published = true
    )
  );
