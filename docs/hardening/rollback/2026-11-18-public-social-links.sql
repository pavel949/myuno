-- Restrictive rollback: hide the social metadata; retain configured values and admin access.
DROP POLICY IF EXISTS system_settings_public_social_links_read ON public.system_settings;
