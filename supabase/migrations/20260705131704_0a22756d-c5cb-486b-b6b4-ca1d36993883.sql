-- Sprint 1 · Phase 0 · Step 3 — harden public deal view grants
-- Revoke write privileges from anon/authenticated on public deal views.
-- SELECT is retained; base-table RLS still governs row visibility.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.v_investment_deals_public FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.investment_deals_public   FROM anon, authenticated;