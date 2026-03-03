
-- Fix: Recreate view with security_invoker to use caller's permissions
DROP VIEW IF EXISTS public.life_os_catalog;

CREATE VIEW public.life_os_catalog
WITH (security_invoker = on) AS

SELECT l.vertical AS entity_type, l.id::text AS entity_id, l.name_en AS title, l.name_ru AS title_ru, l.price, COALESCE(l.currency, 'THB') AS currency, COALESCE(l.district, l.address) AS location, l.provider_id::text, CASE WHEN l.is_verified = true THEN 'verified' ELSE 'standard' END AS trust_level FROM public.listings l WHERE l.is_active = true
UNION ALL
SELECT 'property', p.id::text, p.title_en, p.title_ru, p.price, COALESCE(p.currency, 'THB'), p.district, p.provider_id::text, CASE WHEN p.is_verified = true THEN 'verified' ELSE 'standard' END FROM public.properties p WHERE p.is_active = true AND p.approval_status = 'approved'
UNION ALL
SELECT 'event', e.id::text, e.title_en, e.title_ru, e.price, COALESCE(e.currency, 'THB'), e.location_name, e.provider_id::text, 'standard' FROM public.events e WHERE e.is_active = true
UNION ALL
SELECT 'water_activity', wa.id::text, wa.title_en, wa.title_ru, wa.price, COALESCE(wa.currency, 'THB'), wa.location_name, wa.provider_id::text, 'standard' FROM public.water_activities wa WHERE wa.is_active = true
UNION ALL
SELECT 'gym', g.id::text, g.name_en, g.name_ru, NULL::numeric, COALESCE(g.currency, 'THB'), g.district, g.provider_id::text, 'standard' FROM public.gyms g WHERE g.is_active = true
UNION ALL
SELECT 'salon', s.id::text, s.name_en, s.name_ru, NULL::numeric, COALESCE(s.currency, 'THB'), s.district, s.provider_id::text, 'standard' FROM public.salons s WHERE s.is_active = true
UNION ALL
SELECT 'legal_service', ls.id::text, ls.name_en, ls.name_ru, NULL::numeric, COALESCE(ls.currency, 'THB'), ls.district, ls.provider_id::text, 'standard' FROM public.legal_services ls WHERE ls.is_active = true
UNION ALL
SELECT 'flower_shop', fs.id::text, fs.name_en, fs.name_ru, NULL::numeric, 'THB', NULL, fs.provider_id::text, 'standard' FROM public.flower_shops fs WHERE fs.is_active = true
UNION ALL
SELECT 'insurance', ip.id::text, ip.name_en, ip.name_ru, NULL::numeric, COALESCE(ip.currency, 'THB'), ip.district, ip.provider_id::text, 'standard' FROM public.insurance_providers ip WHERE ip.is_active = true
UNION ALL
SELECT 'cleaning', cs.id::text, cs.name_en, cs.name_ru, NULL::numeric, COALESCE(cs.currency, 'THB'), NULL, cs.provider_id::text, 'standard' FROM public.cleaning_services cs WHERE cs.is_active = true
UNION ALL
SELECT 'babysitter', b.id::text, b.name_en, b.name_ru, NULL::numeric, COALESCE(b.currency, 'THB'), b.district, b.provider_id::text, 'standard' FROM public.babysitters b WHERE b.is_active = true
UNION ALL
SELECT 'pet_service', ps.id::text, ps.name_en, ps.name_ru, ps.price, COALESCE(ps.currency, 'THB'), ps.district, ps.provider_id::text, 'standard' FROM public.pet_services ps WHERE ps.is_active = true
UNION ALL
SELECT 'airport_service', aps.id::text, aps.name_en, aps.name_ru, aps.base_price, COALESCE(aps.currency, 'THB'), NULL, aps.supplier_id::text, 'standard' FROM public.airport_services aps WHERE aps.is_active = true;

GRANT SELECT ON public.life_os_catalog TO anon, authenticated;
