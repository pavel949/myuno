
CREATE OR REPLACE VIEW public.v_public_movers AS
SELECT
  id,
  business_name,
  business_name_ru,
  district,
  city,
  website,
  COALESCE(source_data->'specialties', '[]'::jsonb) AS specialties,
  COALESCE(source_data->'languages', '[]'::jsonb) AS languages,
  COALESCE(source_data->'service_areas', '[]'::jsonb) AS service_areas,
  COALESCE((source_data->>'verified')::boolean, false) AS verified,
  status,
  ai_priority,
  created_at
FROM public.vendor_prospects
WHERE category = 'relocation-services'
  AND status IN ('new','researching','contacted','replied','meeting','negotiating','won');

GRANT SELECT ON public.v_public_movers TO anon, authenticated;
