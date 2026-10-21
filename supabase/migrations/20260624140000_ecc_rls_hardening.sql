-- ECC RLS hardening pass (2026-06-24)
--
-- Closes a set of broad-grant RLS holes surfaced by the repo-wide audit:
--   * profiles: every authenticated user could read all users' PII
--   * development_units / resale_properties / project_units: any authenticated
--     user could INSERT/UPDATE/DELETE real-estate inventory
--   * pipeline_stage_history / founder_daily_brief / contact_identities:
--     cross-tenant CRM intelligence + the full contact graph were world-readable
--   * security_audit_log / service_order_status_history / calendar_sync_logs /
--     property_analytics / property_listing_scores: open WITH CHECK (true) writes
--   * match_ai_knowledge: executable by anon
--
-- None of the locked-down tables are written directly from the frontend (verified
-- by grep over src/); edge functions use the service role, which bypasses RLS, and
-- audit/CRM history is written by SECURITY DEFINER triggers. So restricting these
-- policies does not break the client. Reads that legitimately need cross-user
-- profile fields (name/avatar) should migrate to the v_profile_public view below.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. profiles — stop leaking PII to every authenticated session
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop every known over-broad SELECT policy variant (names have drifted across
-- migrations); recreate a single scoped one.
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Profiles: self or staff read"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR (SELECT public.has_role(auth.uid(), 'admin'))
    OR (SELECT public.has_role(auth.uid(), 'staff'))
    OR (SELECT public.has_role(auth.uid(), 'uno_team'))
    OR (SELECT public.has_role(auth.uid(), 'support'))
    OR (SELECT public.has_role(auth.uid(), 'sales'))
  );

-- Re-assert the own-row UPDATE policy WITH CHECK so a user cannot repoint their
-- own row's id (drop the known name variants first, then recreate).
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Safe public projection for cross-user name/avatar display. Runs with the
-- definer's rights (default view behaviour) so it exposes ONLY these columns,
-- never the sensitive PII columns on profiles.
CREATE OR REPLACE VIEW public.v_profile_public AS
  SELECT id, full_name, display_name, avatar_url, preferred_language, primary_role
  FROM public.profiles;
GRANT SELECT ON public.v_profile_public TO authenticated, anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. development_units — public listings stay readable; writes are privileged
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can manage development units" ON public.development_units;

CREATE POLICY "development_units public read"
  ON public.development_units FOR SELECT
  USING (true);

CREATE POLICY "development_units privileged write"
  ON public.development_units FOR ALL
  TO authenticated
  USING (
    (SELECT public.has_role(auth.uid(), 'admin'))
    OR (SELECT public.has_role(auth.uid(), 'broker'))
    OR (SELECT public.has_role(auth.uid(), 'property_manager'))
    OR (SELECT public.has_role(auth.uid(), 'staff'))
    OR (SELECT public.has_role(auth.uid(), 'uno_team'))
  )
  WITH CHECK (
    (SELECT public.has_role(auth.uid(), 'admin'))
    OR (SELECT public.has_role(auth.uid(), 'broker'))
    OR (SELECT public.has_role(auth.uid(), 'property_manager'))
    OR (SELECT public.has_role(auth.uid(), 'staff'))
    OR (SELECT public.has_role(auth.uid(), 'uno_team'))
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. resale_properties — public read; writes by creator or privileged roles
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can manage resale properties" ON public.resale_properties;

CREATE POLICY "resale_properties public read"
  ON public.resale_properties FOR SELECT
  USING (true);

CREATE POLICY "resale_properties owner or privileged write"
  ON public.resale_properties FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid()
    OR (SELECT public.has_role(auth.uid(), 'admin'))
    OR (SELECT public.has_role(auth.uid(), 'broker'))
    OR (SELECT public.has_role(auth.uid(), 'staff'))
    OR (SELECT public.has_role(auth.uid(), 'uno_team'))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (SELECT public.has_role(auth.uid(), 'admin'))
    OR (SELECT public.has_role(auth.uid(), 'broker'))
    OR (SELECT public.has_role(auth.uid(), 'staff'))
    OR (SELECT public.has_role(auth.uid(), 'uno_team'))
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. project_units — `OR auth.uid() IS NOT NULL` nullified the ownership check
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Creators can update project_units" ON public.project_units;
DROP POLICY IF EXISTS "Creators can delete project_units" ON public.project_units;

CREATE POLICY "Creators or admins update project_units"
  ON public.project_units FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR (SELECT public.has_role(auth.uid(), 'admin')))
  WITH CHECK (created_by = auth.uid() OR (SELECT public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Creators or admins delete project_units"
  ON public.project_units FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR (SELECT public.has_role(auth.uid(), 'admin')));

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. pipeline_stage_history — cross-tenant CRM transitions were world-read/write
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can view pipeline history" ON public.pipeline_stage_history;
DROP POLICY IF EXISTS "Authenticated users can insert pipeline history" ON public.pipeline_stage_history;

CREATE POLICY "pipeline_stage_history staff read"
  ON public.pipeline_stage_history FOR SELECT
  TO authenticated
  USING (
    (SELECT public.has_role(auth.uid(), 'admin'))
    OR (SELECT public.has_role(auth.uid(), 'staff'))
    OR (SELECT public.has_role(auth.uid(), 'uno_team'))
    OR (SELECT public.has_role(auth.uid(), 'sales'))
    OR (SELECT public.has_role(auth.uid(), 'support'))
  );
-- INSERT intentionally has no authenticated policy: the history is written by a
-- SECURITY DEFINER trigger (runs as owner, bypasses RLS) and by edge functions
-- using the service role. Direct client inserts are denied.

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. founder_daily_brief — per-company AI briefs were world-read/write
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can read briefs" ON public.founder_daily_brief;
DROP POLICY IF EXISTS "Authenticated users can insert briefs" ON public.founder_daily_brief;

CREATE POLICY "founder_daily_brief staff read"
  ON public.founder_daily_brief FOR SELECT
  TO authenticated
  USING (
    (SELECT public.has_role(auth.uid(), 'admin'))
    OR (SELECT public.has_role(auth.uid(), 'staff'))
    OR (SELECT public.has_role(auth.uid(), 'uno_team'))
  );
-- INSERT denied for clients; written by edge functions via the service role.

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. contact_identities / contact_identity_links — full contact graph was open
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "identities readable by authenticated" ON public.contact_identities;
DROP POLICY IF EXISTS "identity links readable by authenticated" ON public.contact_identity_links;

CREATE POLICY "contact_identities staff read"
  ON public.contact_identities FOR SELECT
  TO authenticated
  USING (
    primary_user_id = auth.uid()
    OR (SELECT public.has_role(auth.uid(), 'admin'))
    OR (SELECT public.has_role(auth.uid(), 'staff'))
    OR (SELECT public.has_role(auth.uid(), 'uno_team'))
    OR (SELECT public.has_role(auth.uid(), 'sales'))
    OR (SELECT public.has_role(auth.uid(), 'support'))
  );

CREATE POLICY "contact_identity_links staff read"
  ON public.contact_identity_links FOR SELECT
  TO authenticated
  USING (
    (SELECT public.has_role(auth.uid(), 'admin'))
    OR (SELECT public.has_role(auth.uid(), 'staff'))
    OR (SELECT public.has_role(auth.uid(), 'uno_team'))
    OR (SELECT public.has_role(auth.uid(), 'sales'))
    OR (SELECT public.has_role(auth.uid(), 'support'))
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Open WITH CHECK (true) write policies on audit/log/analytics tables.
--    These are written exclusively by edge functions (service role) / triggers,
--    so dropping the open client-write policy is safe and closes the poisoning
--    vector. Admin read added where a dashboard needs it.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "System can insert security logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "Insert order history" ON public.service_order_status_history;
DROP POLICY IF EXISTS "System can insert sync logs" ON public.calendar_sync_logs;
DROP POLICY IF EXISTS "System can insert analytics" ON public.property_analytics;
DROP POLICY IF EXISTS "System can update analytics" ON public.property_analytics;
DROP POLICY IF EXISTS "System can manage listing scores" ON public.property_listing_scores;

CREATE POLICY "security_audit_log admin read"
  ON public.security_audit_log FOR SELECT
  TO authenticated
  USING ((SELECT public.has_role(auth.uid(), 'admin')));

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. match_ai_knowledge — internal knowledge base was executable by anon
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.match_ai_knowledge(vector, int, float, text) FROM anon;
