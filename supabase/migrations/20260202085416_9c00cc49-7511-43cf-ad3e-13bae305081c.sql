-- Fix 1: Move pg_net extension from public to extensions schema
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Fix 2: Replace overly permissive RLS policies with proper authentication checks

-- 2a. ai_agent_logs - only authenticated users can insert logs
DROP POLICY IF EXISTS "Anyone can insert logs" ON public.ai_agent_logs;
CREATE POLICY "Authenticated users can insert logs" 
  ON public.ai_agent_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2b. calendar_sync_logs - only authenticated property owners can insert
DROP POLICY IF EXISTS "System can insert sync logs" ON public.calendar_sync_logs;
CREATE POLICY "Owners can insert sync logs" 
  ON public.calendar_sync_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

-- 2c. mcc_events - only authenticated users can create events  
DROP POLICY IF EXISTS "Anyone can create events" ON public.mcc_events;
CREATE POLICY "Authenticated users can create events" 
  ON public.mcc_events 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2d. mcc_leads - only authenticated users can create leads
DROP POLICY IF EXISTS "Anyone can create leads" ON public.mcc_leads;
CREATE POLICY "Authenticated users can create leads" 
  ON public.mcc_leads 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2e. property_analytics - only admins/system can insert/update using helper function
DROP POLICY IF EXISTS "System can insert analytics" ON public.property_analytics;
DROP POLICY IF EXISTS "System can update analytics" ON public.property_analytics;

CREATE POLICY "Admins can insert analytics" 
  ON public.property_analytics 
  FOR INSERT 
  WITH CHECK (is_admin_or_uno_team());

CREATE POLICY "Admins can update analytics" 
  ON public.property_analytics 
  FOR UPDATE 
  USING (is_admin_or_uno_team());

-- 2f. pwa_installs - only authenticated users can log installs
DROP POLICY IF EXISTS "Anyone can log installs" ON public.pwa_installs;
CREATE POLICY "Authenticated users can log installs" 
  ON public.pwa_installs 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);