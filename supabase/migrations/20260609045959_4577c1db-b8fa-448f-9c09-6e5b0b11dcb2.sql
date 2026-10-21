-- Grant Data API access to onboarding tables so anon and authenticated users can submit
GRANT INSERT, SELECT ON public.concierge_sessions TO anon;
GRANT INSERT, SELECT, UPDATE ON public.concierge_sessions TO authenticated;
GRANT ALL ON public.concierge_sessions TO service_role;

GRANT INSERT, SELECT ON public.concierge_journeys TO anon;
GRANT INSERT, SELECT, UPDATE ON public.concierge_journeys TO authenticated;
GRANT ALL ON public.concierge_journeys TO service_role;