CREATE POLICY system_settings_public_catalog_flags_read
ON public.system_settings FOR SELECT TO anon, authenticated
USING (key IN ('feature_flag:multi_unit_properties', 'feature_flag:thai_business_layer'));