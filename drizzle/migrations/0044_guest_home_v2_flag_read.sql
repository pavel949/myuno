CREATE POLICY system_settings_public_home_v2_flag_read
ON public.system_settings FOR SELECT TO anon, authenticated
USING (key = 'feature_flag:home_v2');