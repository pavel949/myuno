
-- =============================================================
-- Security fix: Restrict privileged fields on listings table
-- and tighten analytics INSERT policies
-- =============================================================

-- 1. LISTINGS: Replace provider policy to prevent setting privileged fields
-- Providers should NOT be able to set is_verified=true or approval_status='approved'

DROP POLICY IF EXISTS "listings_provider_manage" ON public.listings;

-- Providers can SELECT their own listings (including non-approved for management)
CREATE POLICY "listings_provider_select" ON public.listings
  FOR SELECT TO authenticated
  USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

-- Providers can INSERT but cannot self-verify or self-approve
CREATE POLICY "listings_provider_insert" ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    AND (is_verified IS NULL OR is_verified = false)
    AND (approval_status IS NULL OR approval_status = 'pending')
  );

-- Providers can UPDATE their own listings but cannot change privileged fields
CREATE POLICY "listings_provider_update" ON public.listings
  FOR UPDATE TO authenticated
  USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()))
  WITH CHECK (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    AND (is_verified IS NULL OR is_verified = false OR is_verified = (SELECT is_verified FROM public.listings WHERE id = listings.id))
    AND (approval_status IS NULL OR approval_status = (SELECT approval_status FROM public.listings WHERE id = listings.id) OR approval_status = 'pending')
  );

-- Providers can DELETE their own listings
CREATE POLICY "listings_provider_delete" ON public.listings
  FOR DELETE TO authenticated
  USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

-- 2. ANALYTICS: Tighten page_views INSERT to validate ownership
DROP POLICY IF EXISTS "Track page views" ON public.page_views;
CREATE POLICY "Track page views" ON public.page_views
  FOR INSERT TO authenticated
  WITH CHECK (
    session_id IS NOT NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Tighten user_events - ensure user_id matches if provided
DROP POLICY IF EXISTS "Track user events" ON public.user_events;
CREATE POLICY "Track user events" ON public.user_events
  FOR INSERT TO authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND event_type IS NOT NULL
  );

-- Ensure no UPDATE/DELETE on analytics tables for non-admins
-- (page_views and user_events should be append-only)
DROP POLICY IF EXISTS "pageviews_update" ON public.page_views;
DROP POLICY IF EXISTS "events_update" ON public.user_events;
DROP POLICY IF EXISTS "events_delete" ON public.user_events;
DROP POLICY IF EXISTS "pageviews_delete" ON public.page_views;
