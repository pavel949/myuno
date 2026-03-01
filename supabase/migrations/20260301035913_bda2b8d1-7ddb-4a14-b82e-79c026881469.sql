
-- ============================================================
-- PHASE 1: Critical Security Fixes
-- 1) Trigger to block user_type modification via client
-- 2) Remove duplicate profiles UPDATE policy
-- 3) Migrate 25 policies from profiles.user_type to is_admin_or_uno_team()
-- 4) Fix management_companies UPDATE policy bug
-- ============================================================

-- 1. TRIGGER: Block user_type changes (only service_role can change it)
CREATE OR REPLACE FUNCTION public.prevent_user_type_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.user_type IS DISTINCT FROM NEW.user_type THEN
    -- Only allow if called by service_role (e.g. admin edge functions)
    IF current_setting('role', true) != 'service_role' THEN
      NEW.user_type := OLD.user_type;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_user_type_change ON profiles;
CREATE TRIGGER trg_prevent_user_type_change
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_user_type_change();

-- 2. Remove duplicate profiles UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- 3. Migrate all 25 policies from profiles.user_type to is_admin_or_uno_team()

-- 3.1 ai_agent_knowledge
DROP POLICY IF EXISTS "Admins can manage all knowledge" ON ai_agent_knowledge;
CREATE POLICY "Admins can manage all knowledge" ON ai_agent_knowledge
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.2 ai_agent_logs
DROP POLICY IF EXISTS "Admins can view all logs" ON ai_agent_logs;
CREATE POLICY "Admins can view all logs" ON ai_agent_logs
  FOR SELECT TO authenticated
  USING (is_admin_or_uno_team());

-- 3.3 ai_agents
DROP POLICY IF EXISTS "Admins can manage all agents" ON ai_agents;
CREATE POLICY "Admins can manage all agents" ON ai_agents
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.4 airport_booking_addons
DROP POLICY IF EXISTS "Users can manage addons for own bookings" ON airport_booking_addons;
CREATE POLICY "Users can manage addons for own bookings" ON airport_booking_addons
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM airport_bookings
      WHERE airport_bookings.id = airport_booking_addons.booking_id
        AND (airport_bookings.user_id = auth.uid() OR is_admin_or_uno_team())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM airport_bookings
      WHERE airport_bookings.id = airport_booking_addons.booking_id
        AND (airport_bookings.user_id = auth.uid() OR is_admin_or_uno_team())
    )
  );

-- 3.5 airport_bookings SELECT
DROP POLICY IF EXISTS "Users can view own airport bookings" ON airport_bookings;
CREATE POLICY "Users can view own airport bookings" ON airport_bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin_or_uno_team());

-- 3.6 airport_bookings UPDATE
DROP POLICY IF EXISTS "Users can update own airport bookings" ON airport_bookings;
CREATE POLICY "Users can update own airport bookings" ON airport_bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR is_admin_or_uno_team());

-- 3.7 airport_passengers
DROP POLICY IF EXISTS "Users can manage passengers for own bookings" ON airport_passengers;
CREATE POLICY "Users can manage passengers for own bookings" ON airport_passengers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM airport_bookings
      WHERE airport_bookings.id = airport_passengers.booking_id
        AND (airport_bookings.user_id = auth.uid() OR is_admin_or_uno_team())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM airport_bookings
      WHERE airport_bookings.id = airport_passengers.booking_id
        AND (airport_bookings.user_id = auth.uid() OR is_admin_or_uno_team())
    )
  );

-- 3.8 airport_suppliers
DROP POLICY IF EXISTS "Admins can manage airport suppliers" ON airport_suppliers;
CREATE POLICY "Admins can manage airport suppliers" ON airport_suppliers
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.9 cohort_analytics
DROP POLICY IF EXISTS "cohort_select" ON cohort_analytics;
CREATE POLICY "cohort_select" ON cohort_analytics
  FOR SELECT TO authenticated
  USING (is_admin_or_uno_team());

-- 3.10 event_occurrences
DROP POLICY IF EXISTS "Admin can manage event occurrences" ON event_occurrences;
CREATE POLICY "Admin can manage event occurrences" ON event_occurrences
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.11 experience_media
DROP POLICY IF EXISTS "Admins can manage experience media" ON experience_media;
CREATE POLICY "Admins can manage experience media" ON experience_media
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.12 experience_pricing
DROP POLICY IF EXISTS "Admins can manage experience pricing" ON experience_pricing;
CREATE POLICY "Admins can manage experience pricing" ON experience_pricing
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.13 funnel_analytics
DROP POLICY IF EXISTS "funnel_select" ON funnel_analytics;
CREATE POLICY "funnel_select" ON funnel_analytics
  FOR SELECT TO authenticated
  USING (is_admin_or_uno_team());

-- 3.14 orders SELECT
DROP POLICY IF EXISTS "orders_admin_select_all" ON orders;
CREATE POLICY "orders_admin_select_all" ON orders
  FOR SELECT TO authenticated
  USING (is_admin_or_uno_team());

-- 3.15 orders UPDATE
DROP POLICY IF EXISTS "orders_admin_update" ON orders;
CREATE POLICY "orders_admin_update" ON orders
  FOR UPDATE TO authenticated
  USING (is_admin_or_uno_team());

-- 3.16 page_views
DROP POLICY IF EXISTS "pageviews_select" ON page_views;
CREATE POLICY "pageviews_select" ON page_views
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_uno_team());

-- 3.17 platform_events
DROP POLICY IF EXISTS "admins_manage_events" ON platform_events;
CREATE POLICY "admins_manage_events" ON platform_events
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.18 platform_news
DROP POLICY IF EXISTS "admins_manage_news" ON platform_news;
CREATE POLICY "admins_manage_news" ON platform_news
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.19 platform_recommendations
DROP POLICY IF EXISTS "admins_manage_recs" ON platform_recommendations;
CREATE POLICY "admins_manage_recs" ON platform_recommendations
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.20 sys_intake_configs
DROP POLICY IF EXISTS "Admins can manage intake configs" ON sys_intake_configs;
CREATE POLICY "Admins can manage intake configs" ON sys_intake_configs
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.21 sys_lead_configs
DROP POLICY IF EXISTS "Admins can manage lead configs" ON sys_lead_configs;
CREATE POLICY "Admins can manage lead configs" ON sys_lead_configs
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.22 user_analytics_daily
DROP POLICY IF EXISTS "daily_select" ON user_analytics_daily;
CREATE POLICY "daily_select" ON user_analytics_daily
  FOR SELECT TO authenticated
  USING (is_admin_or_uno_team());

-- 3.23 user_events
DROP POLICY IF EXISTS "events_select" ON user_events;
CREATE POLICY "events_select" ON user_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_uno_team());

-- 3.24 user_segments
DROP POLICY IF EXISTS "segments_select" ON user_segments;
CREATE POLICY "segments_select" ON user_segments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_uno_team());

-- 3.25 user_sessions
DROP POLICY IF EXISTS "sessions_select" ON user_sessions;
CREATE POLICY "sessions_select" ON user_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_uno_team());

-- 4. Fix management_companies UPDATE policy bug
DROP POLICY IF EXISTS "Company members can update their company" ON management_companies;
CREATE POLICY "Company directors can update their company" ON management_companies
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM management_company_members
      WHERE management_company_members.company_id = management_companies.id
        AND management_company_members.user_id = auth.uid()
        AND management_company_members.role IN ('director', 'admin')
        AND management_company_members.is_active = true
    )
  );
