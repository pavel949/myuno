-- ============================================================
-- Phase 1.1: Security Fixes - P0 Critical (Final Corrected)
-- ============================================================

-- 1. Fix SECURITY DEFINER on lifeos_health_view
DROP VIEW IF EXISTS public.lifeos_health_view;

CREATE VIEW public.lifeos_health_view
WITH (security_invoker = true)
AS
WITH mapping_stats AS (
    SELECT 
        ls.id AS situation_id,
        ls.code AS situation_code,
        ls.title_en,
        ls.title_ru,
        ls.is_active,
        count(clm.id) AS total_entities,
        count(CASE WHEN (clm.rules ->> 'priority_type') = 'primary' THEN 1 END) AS primary_count,
        count(CASE WHEN (clm.rules ->> 'priority_type') = 'secondary' THEN 1 END) AS secondary_count,
        COALESCE(avg(clm.weight), 0) AS avg_weight,
        min(clm.weight) AS min_weight,
        max(clm.weight) AS max_weight,
        max(clm.updated_at) AS last_updated_at,
        count(DISTINCT clm.entity_type) AS entity_type_count
    FROM life_situations ls
    LEFT JOIN catalog_life_map clm ON clm.life_situation_id = ls.id
    GROUP BY ls.id, ls.code, ls.title_en, ls.title_ru, ls.is_active
),
entity_overuse AS (
    SELECT entity_type, entity_id, count(*) AS scenario_count
    FROM catalog_life_map
    GROUP BY entity_type, entity_id
    HAVING count(*) > 3
)
SELECT 
    situation_id,
    situation_code,
    title_en,
    title_ru,
    is_active,
    total_entities,
    primary_count,
    secondary_count,
    avg_weight,
    min_weight,
    max_weight,
    last_updated_at,
    entity_type_count,
    CASE WHEN primary_count = 0 AND is_active THEN true ELSE false END AS flag_no_primary,
    CASE WHEN total_entities < 3 AND is_active THEN true ELSE false END AS flag_low_coverage,
    CASE WHEN primary_count > 2 THEN true ELSE false END AS flag_primary_overload,
    CASE WHEN min_weight < 40 OR max_weight > 85 THEN true ELSE false END AS flag_weight_out_of_range,
    (SELECT count(*) FROM entity_overuse) AS entity_overuse_count,
    CASE
        WHEN total_entities = 0 THEN 0
        WHEN primary_count = 0 THEN 25
        WHEN total_entities < 3 THEN 50
        WHEN primary_count > 2 THEN 60
        ELSE LEAST(100, 70 + total_entities * 2)
    END AS health_score
FROM mapping_stats ms
ORDER BY is_active DESC, total_entities DESC;

-- 2. Fix SECURITY DEFINER on experiences_normalized
DROP VIEW IF EXISTS public.experiences_normalized;

CREATE VIEW public.experiences_normalized
WITH (security_invoker = true)
AS
SELECT 
    e.id, e.provider_id, e.title_en, e.title_ru, e.description_en, e.description_ru,
    e.experience_type, e.category, e.tags, e.price, e.price_per, e.currency,
    e.duration_minutes, e.min_participants, e.max_participants, e.age_restriction,
    e.meeting_point, e.meeting_point_lat, e.meeting_point_lng, e.location_name,
    e.difficulty, e.includes, e.excludes, e.highlights, e.requirements,
    e.itinerary, e.equipment_included, e.is_certified, e.certification_details,
    e.safety_briefing_required, e.cover_image, e.images, e.available_days,
    e.start_times, e.is_active, e.is_featured, e.rating, e.review_count,
    e.approval_status, e.rejection_reason, e.reviewed_by, e.reviewed_at,
    e.created_by_uno_team, e.uno_team_creator_id, e.source_type, e.partner_id,
    e.external_link, e.commission_rate, e.created_at, e.updated_at,
    COALESCE(tn_cat.normalized_value, lower(replace(e.category, '-', '_'))) AS category_normalized,
    COALESCE(tn_diff.normalized_value, lower(e.difficulty)) AS difficulty_normalized,
    CASE
        WHEN e.experience_type = 'tour' THEN 'guided_tour'
        WHEN e.experience_type = 'activity' THEN 'self_activity'
        ELSE 'curated_experience'
    END AS inferred_classification
FROM experiences e
LEFT JOIN taxonomy_normalization tn_cat ON (
    tn_cat.entity_type = 'experience' AND 
    tn_cat.field_name = 'category' AND 
    tn_cat.original_value = e.category AND 
    tn_cat.is_active = true
)
LEFT JOIN taxonomy_normalization tn_diff ON (
    tn_diff.entity_type = 'experience' AND 
    tn_diff.field_name = 'difficulty' AND 
    tn_diff.original_value = e.difficulty AND 
    tn_diff.is_active = true
);

-- 3. Fix SECURITY DEFINER on life_os_catalog
DROP VIEW IF EXISTS public.life_os_catalog;

CREATE VIEW public.life_os_catalog
WITH (security_invoker = true)
AS
SELECT 'property'::text AS entity_type, id::text AS entity_id, title_en AS title, title_ru, price, currency, district AS location, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END AS trust_level FROM properties WHERE is_active = true
UNION ALL
SELECT 'service'::text, id::text, name_en, name_ru, price, currency, NULL::text, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM services WHERE is_active = true
UNION ALL
SELECT 'yacht'::text, id::text, name_en, name_ru, price_full_day, currency, location_name, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM yachts WHERE is_active = true
UNION ALL
SELECT 'vehicle'::text, id::text, name_en, name_ru, price_per_day::numeric, currency, NULL::text, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM vehicles WHERE is_active = true
UNION ALL
SELECT 'tour'::text, id::text, title_en, title_ru, price, currency, meeting_point, provider_id::text, CASE WHEN approval_status = 'approved' THEN 'verified' ELSE 'pending' END FROM tours WHERE is_active = true
UNION ALL
SELECT 'experience'::text, id::text, title_en, title_ru, price, currency, location_name, provider_id::text, CASE WHEN approval_status = 'approved' THEN 'verified' ELSE 'pending' END FROM experiences WHERE is_active = true
UNION ALL
SELECT 'restaurant'::text, id::text, name_en, name_ru, min_order_amount, 'THB'::text, district, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM restaurants WHERE is_active = true
UNION ALL
SELECT 'salon'::text, id::text, name_en, name_ru, NULL::numeric, 'THB'::text, district, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM salons WHERE is_active = true
UNION ALL
SELECT 'clinic'::text, id::text, name_en, name_ru, NULL::numeric, 'THB'::text, district, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM clinics WHERE is_active = true
UNION ALL
SELECT 'gym'::text, id::text, name_en, name_ru, price_month_pass, currency, district, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM gyms WHERE is_active = true
UNION ALL
SELECT 'babysitter'::text, id::text, name_en, name_ru, price_per_hour, currency, NULL::text, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM babysitters WHERE is_active = true
UNION ALL
SELECT 'pet_service'::text, id::text, name_en, name_ru, price_from, currency, district, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM pet_services WHERE is_active = true
UNION ALL
SELECT 'legal_service'::text, id::text, name_en, name_ru, price_consultation, currency, NULL::text, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM legal_services WHERE is_active = true;

-- 4. Fix overly permissive RLS policy on catalog_hygiene_log (using correct app_role values)
DROP POLICY IF EXISTS hygiene_log_system_insert ON public.catalog_hygiene_log;

CREATE POLICY "hygiene_log_admin_insert" ON public.catalog_hygiene_log
FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL AND (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'uno_team')
        )
    )
);

-- 5. Fix function without search_path
CREATE OR REPLACE FUNCTION public.update_yacht_availability_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 6. Grant SELECT on views
GRANT SELECT ON public.lifeos_health_view TO authenticated;
GRANT SELECT ON public.experiences_normalized TO authenticated, anon;
GRANT SELECT ON public.life_os_catalog TO authenticated, anon;