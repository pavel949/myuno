
-- Fix: Remove overly permissive INSERT policy, edge function uses service_role which bypasses RLS
DROP POLICY "System insert scheduled messages" ON public.booking_scheduled_messages;

-- Only owners can insert (for manual sends)
CREATE POLICY "Owners insert their scheduled messages"
  ON public.booking_scheduled_messages FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
