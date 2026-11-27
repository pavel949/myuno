-- Forward-only repair: catalogue admission and sales-status compatibility.
-- E2.9 finite privacy boundary. No business-row writes or support grants.
CREATE OR REPLACE VIEW public.public_provider_catalog WITH (security_barrier=true) AS
SELECT id,name,description_en,description_ru,logo_url,cover_image,website,
 NULL::text AS phone,NULL::text AS email,
 is_verified,trust_score,is_active,created_at,updated_at,business_category,rating,review_count,
 address,lat,lng,languages,has_machine_translation,provider_type,response_time_minutes,
 has_insurance,has_guarantee,service_domains,approval_status,booking_flow,coverage_areas,is_demo,city_id
FROM public.providers WHERE is_active=true AND approval_status='approved' AND is_demo IS NOT TRUE;
GRANT SELECT ON public.public_provider_catalog TO anon,authenticated,service_role;
REVOKE ALL ON public.public_provider_catalog FROM PUBLIC;
COMMENT ON VIEW public.public_provider_catalog IS 'E2.9 read-only owner-executed allowlisted public projection; no provider contact/settlement/commission/owner identifiers. Base RLS is private.';

CREATE OR REPLACE VIEW public.public_service_catalog WITH (security_barrier=true) AS
SELECT s.id,s.provider_id,s.category_id,s.location_id,s.name_en,s.name_ru,s.description_en,s.description_ru,
 s.price,s.currency,s.duration_minutes,s.images,s.tags,s.is_active,s.created_at,s.updated_at,
 s.approval_status,s.languages,s.is_verified,s.pricing_model,s.unit,s.lead_time_hours,s.availability_mode,s.booking_flow,
 c.slug AS category_slug,jsonb_build_object('name_en',c.name_en,'name_ru',c.name_ru,'slug',c.slug) AS category,
 CASE WHEN p.id IS NULL THEN NULL ELSE jsonb_build_object('id',p.id,'name',p.name,'logo_url',p.logo_url,'is_verified',p.is_verified,
 'rating',p.rating,'is_active',p.is_active,'has_machine_translation',p.has_machine_translation) END AS provider
FROM public.services s JOIN public.public_provider_catalog p ON p.id=s.provider_id
LEFT JOIN public.categories c ON c.id=s.category_id
WHERE s.is_active=true AND s.approval_status='approved' AND c.is_active IS TRUE;
GRANT SELECT ON public.public_service_catalog TO anon,authenticated,service_role;
REVOKE ALL ON public.public_service_catalog FROM PUBLIC;
COMMENT ON VIEW public.public_service_catalog IS 'E2.9 active approved service marketing with safe provider JSON; excludes commission/moderation/import fields; read only.';

CREATE OR REPLACE VIEW public.public_salon_catalog WITH (security_barrier=true) AS
SELECT id,name_en,name_ru,description_en,description_ru,salon_type,cover_image,images,address,district,
 lat,lng,NULL::text AS phone,NULL::text AS email,website,working_hours,services,amenities,languages,
 price_from,currency,rating,review_count,is_featured,is_verified,is_active,provider_id,created_at,updated_at,
 approval_status,city_id FROM public.salons WHERE is_active=true AND approval_status='approved';
GRANT SELECT ON public.public_salon_catalog TO anon,authenticated,service_role;
REVOKE ALL ON public.public_salon_catalog FROM PUBLIC;
COMMENT ON VIEW public.public_salon_catalog IS 'E2.9 active approved salon marketing only; null contact compatibility slots, no review/rejection/creator fields.';


-- Default table grants also apply to newly created updatable views.
-- Keep existing SELECT admission; never allow mutations through catalogue projections.
DO $catalog_grants$
DECLARE view_name text;
BEGIN
  FOREACH view_name IN ARRAY ARRAY[
    'public_property_catalog','public_provider_catalog','public_service_catalog',
    'public_salon_catalog','public_room_category_catalog','public_room_rate_plan_catalog',
    'public_room_rate_season_catalog','public_room_stay_rule_catalog'
  ] LOOP
    IF to_regclass(format('public.%I',view_name)) IS NOT NULL THEN
      EXECUTE format('REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.%I FROM PUBLIC,anon,authenticated,service_role',view_name);
    END IF;
  END LOOP;
END
$catalog_grants$;

-- unit_status is the complete sales state; status is the legacy compatibility summary.
ALTER TABLE public.project_units ALTER COLUMN status SET DEFAULT 'unknown';
ALTER TABLE public.project_units ALTER COLUMN unit_status SET DEFAULT 'unknown';
CREATE OR REPLACE FUNCTION public.sync_project_unit_status()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $status_sync$
DECLARE
  chosen text;
  legacy_candidate text;
  legacy_summary text;
  modern_changed boolean := false;
  legacy_changed boolean := false;
BEGIN
  legacy_candidate := CASE coalesce(NEW.status,'unknown')
    WHEN 'held' THEN 'soft_hold'
    WHEN 'available' THEN 'available'
    WHEN 'reserved' THEN 'reserved'
    WHEN 'sold' THEN 'sold'
    WHEN 'unknown' THEN 'unknown'
    ELSE NULL END;
  IF TG_OP='UPDATE' THEN
    modern_changed := NEW.unit_status IS DISTINCT FROM OLD.unit_status;
    legacy_changed := NEW.status IS DISTINCT FROM OLD.status;
    IF modern_changed THEN
      chosen := coalesce(NEW.unit_status,'unknown');
    ELSIF legacy_changed THEN
      chosen := legacy_candidate;
    ELSE
      chosen := coalesce(NEW.unit_status,legacy_candidate,'unknown');
    END IF;
  ELSE
    IF coalesce(NEW.unit_status,'unknown')='unknown'
       AND coalesce(NEW.status,'unknown')<>'unknown' THEN
      chosen := legacy_candidate;
    ELSE
      chosen := coalesce(NEW.unit_status,legacy_candidate,'unknown');
    END IF;
  END IF;
  IF chosen IS NULL OR chosen NOT IN
    ('available','soft_hold','reserved','spa_signed','sold','blocked','not_for_sale','unknown') THEN
    RAISE EXCEPTION 'Unsupported sales unit status' USING ERRCODE='22023';
  END IF;
  legacy_summary := CASE chosen
    WHEN 'soft_hold' THEN 'held'
    WHEN 'spa_signed' THEN 'reserved'
    WHEN 'blocked' THEN 'unknown'
    WHEN 'not_for_sale' THEN 'unknown'
    ELSE chosen END;
  IF TG_OP='UPDATE' AND modern_changed AND legacy_changed
     AND coalesce(NEW.status,'unknown') IS DISTINCT FROM legacy_summary THEN
    RAISE EXCEPTION 'Conflicting sales unit statuses' USING ERRCODE='22023';
  END IF;
  IF TG_OP='INSERT' AND coalesce(NEW.unit_status,'unknown')<>'unknown'
     AND coalesce(NEW.status,'unknown')<>'unknown'
     AND NEW.status IS DISTINCT FROM legacy_summary THEN
    RAISE EXCEPTION 'Conflicting sales unit statuses' USING ERRCODE='22023';
  END IF;
  NEW.unit_status := chosen;
  NEW.status := legacy_summary;
  RETURN NEW;
END
$status_sync$;
DROP TRIGGER IF EXISTS trg_sync_project_unit_status ON public.project_units;
CREATE TRIGGER trg_sync_project_unit_status BEFORE INSERT OR UPDATE ON public.project_units
FOR EACH ROW EXECUTE FUNCTION public.sync_project_unit_status();
-- Reconcile only the compatibility summary. Preserve the complete recorded state,
-- physical identity, commercial amounts and status_version.
UPDATE public.project_units SET unit_status=unit_status
WHERE unit_status IS NULL OR status IS DISTINCT FROM CASE unit_status
  WHEN 'soft_hold' THEN 'held' WHEN 'spa_signed' THEN 'reserved'
  WHEN 'blocked' THEN 'unknown' WHEN 'not_for_sale' THEN 'unknown'
  ELSE unit_status END;
