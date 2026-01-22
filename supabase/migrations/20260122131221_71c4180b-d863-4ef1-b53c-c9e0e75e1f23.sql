
-- Fix remaining 4 RLS policies with ALL + USING(true)
-- These are analytics tables - restrict write to admins only

-- 1. cohort_analytics
DROP POLICY IF EXISTS "cohort_all" ON public.cohort_analytics;
CREATE POLICY "cohort_read" ON public.cohort_analytics FOR SELECT TO authenticated USING (true);
CREATE POLICY "cohort_write" ON public.cohort_analytics FOR ALL TO authenticated 
USING (public.is_admin_or_uno_team()) WITH CHECK (public.is_admin_or_uno_team());

-- 2. funnel_analytics  
DROP POLICY IF EXISTS "funnel_all" ON public.funnel_analytics;
CREATE POLICY "funnel_read" ON public.funnel_analytics FOR SELECT TO authenticated USING (true);
CREATE POLICY "funnel_write" ON public.funnel_analytics FOR ALL TO authenticated
USING (public.is_admin_or_uno_team()) WITH CHECK (public.is_admin_or_uno_team());

-- 3. user_analytics_daily
DROP POLICY IF EXISTS "daily_all" ON public.user_analytics_daily;
CREATE POLICY "daily_read" ON public.user_analytics_daily FOR SELECT TO authenticated USING (true);
CREATE POLICY "daily_write" ON public.user_analytics_daily FOR ALL TO authenticated
USING (public.is_admin_or_uno_team()) WITH CHECK (public.is_admin_or_uno_team());

-- 4. user_segments
DROP POLICY IF EXISTS "segments_all" ON public.user_segments;
CREATE POLICY "segments_read" ON public.user_segments FOR SELECT TO authenticated USING (true);
CREATE POLICY "segments_write" ON public.user_segments FOR ALL TO authenticated
USING (public.is_admin_or_uno_team()) WITH CHECK (public.is_admin_or_uno_team());
