
-- Allow anon + authenticated to SELECT only the public org_* whitelist.
-- Admin-only policy stays in place for everything else (policies are OR'd).

CREATE POLICY "system_settings_public_org_read"
  ON public.system_settings
  FOR SELECT
  TO anon, authenticated
  USING (
    key IN (
      'org_telephone',
      'org_email',
      'org_street_address',
      'org_postal_code',
      'org_locality',
      'org_region',
      'org_country',
      'org_latitude',
      'org_longitude',
      'org_opening_hours'
    )
  );

GRANT SELECT ON public.system_settings TO anon;
