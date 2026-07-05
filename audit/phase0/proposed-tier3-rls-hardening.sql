-- ============================================================================
-- Sprint 1 · Phase 0 · PROPOSED Tier-3 RLS hardening   ***DRAFT — DO NOT APPLY BLINDLY***
--
-- STATUS: proposal for Pavel's review. Deliberately NOT placed in
--         supabase/migrations/ so Lovable Cloud will not auto-apply it.
-- WHY NOT APPLIED: it could not be tested against the real prod schema from the
--         audit session (prod unreachable). Untested RLS can lock out legitimate
--         access or miss a case. Apply ONLY after running verify-prod-rls.sql and
--         confirming the current state, against a DB you can roll back.
--
-- GOAL: make server-side authorization (not the client persona guard) the wall
--       on the Tier-3 surface. Additive + idempotent where possible.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) investment_deals — stop private columns leaking on published rows.
--    The policy `public can view published deals` (USING is_published=true) has
--    no column restriction. Enforce column-level SELECT grants so anon AND
--    authenticated can read ONLY teaser-safe columns of the base table; private
--    fields are reachable only through admin/capital_team policies or the
--    v_investment_deals_public view.
-- ----------------------------------------------------------------------------
REVOKE SELECT ON public.investment_deals FROM anon, authenticated;

-- Re-grant ONLY the teaser-safe columns. ADJUST this list to match the actual
-- public projection in v_investment_deals_public before applying.
GRANT SELECT (
  id, created_at, category, deal_intent, capital_range,
  title_public, teaser_public, description_public, location_display,
  is_published, published_at, status
) ON public.investment_deals TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2) investment_deals — extend full access from admin-only to capital_team+admin
--    (server-checked roles), so the desk can operate without the `admin` role.
--    Keep the existing "admins manage all deals" policy; add a capital_team one.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "capital_team manages all deals" ON public.investment_deals;
CREATE POLICY "capital_team manages all deals"
  ON public.investment_deals FOR ALL
  USING (public.has_role(auth.uid(), 'capital_team') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'capital_team') OR public.has_role(auth.uid(), 'admin'));

-- ----------------------------------------------------------------------------
-- 3) capital_* — already scoped `auth.uid() = user_id` (per-operator private
--    CRM). No change proposed to the ownership model. If the capital DESK should
--    share a book across capital_team members, that is a design decision for
--    Sprint 3 (deal module), NOT a Phase-0 hardening. Documented here only.
-- ----------------------------------------------------------------------------
-- (no-op — intentional)

-- ----------------------------------------------------------------------------
-- 4) Documents — THE column fix above is HALF the risk.
--    investment_deals.documents_urls is a bare URL array. If the storage bucket
--    serving those files is `public=true`, locking the DB column changes nothing
--    — anyone holding a URL still pulls the document straight from storage.
--    The real fix is: PRIVATE bucket + SIGNED URLs (short-lived), not the column.
--
--    ACTION (depends on verify-prod-rls.sql §4 output):
--      a) Identify which bucket backs documents_urls on real deals.
--      b) That bucket MUST be `public=false`.
--      c) Object-read RLS must require capital_team/admin (interim) until the
--         Sprint-3 deal_access_grants model exists.
--      d) *** CODE CHANGE REQUIRED (not just SQL) ***: once the bucket is private,
--         every place that renders a deal document must switch from a stored
--         public URL to `supabase.storage.from(bucket).createSignedUrl(path, ttl)`.
--         Flipping the bucket private WITHOUT this will break document rendering
--         for legitimate staff — do them together. (I can prepare this diff.)
--
--    Example (uncomment + set <BUCKET> only after confirming the bucket id):
--
--    UPDATE storage.buckets SET public = false WHERE id = '<BUCKET>';
--    DROP POLICY IF EXISTS "capital docs read" ON storage.objects;
--    CREATE POLICY "capital docs read" ON storage.objects FOR SELECT TO authenticated
--      USING (bucket_id = '<BUCKET>'
--             AND (public.has_role(auth.uid(),'capital_team')
--                  OR public.has_role(auth.uid(),'admin')));

COMMIT;

-- ROLLBACK NOTES:
--   1) To undo the column lockdown: GRANT SELECT ON public.investment_deals TO
--      anon, authenticated; (restores prior broad grant).
--   2) Drop policy "capital_team manages all deals".
-- VERIFY AFTER APPLYING: re-run verify-prod-rls.sql — §1 zero rows, §5 shows no
--   private columns granted to anon/authenticated.
