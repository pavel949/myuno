-- Public branding metadata only. Existing verified admin write policies remain unchanged.
CREATE POLICY system_settings_public_social_links_read
ON public.system_settings FOR SELECT TO anon, authenticated
USING (key = 'org_social_links');
