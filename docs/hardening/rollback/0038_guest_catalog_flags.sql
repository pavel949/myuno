-- Security-preserving rollback; settings rows, previous AI admission and admin access remain unchanged.
DROP POLICY IF EXISTS system_settings_public_catalog_flags_read ON public.system_settings;