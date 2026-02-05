-- ═══════════════════════════════════════════════════════════════════════════════
-- LIFE OS ENHANCEMENT - Phase 1: Backend Upgrades (Non-Destructive)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Add role_scope to catalog_life_map (supports guest/resident/owner/investor filtering)
ALTER TABLE public.catalog_life_map 
ADD COLUMN IF NOT EXISTS role_scope text[] DEFAULT ARRAY['guest', 'resident', 'owner', 'investor'];

-- 2. Create unified read-only catalog view (life_os_catalog)
-- This VIEW aggregates all entity types for Life OS resolution
CREATE OR REPLACE VIEW public.life_os_catalog AS
-- Properties (uses title, title_ru - no title_en)
SELECT 
  'property' as entity_type,
  id as entity_id,
  COALESCE(title, title_ru) as title,
  title as title_en,
  title_ru,
  NULL::numeric as price,
  'THB' as currency,
  NULL::text as location,
  owner_id as provider_id,
  'verified'::text as trust_level,
  true as is_active
FROM public.owner_properties

UNION ALL

-- Services
SELECT 
  'service' as entity_type,
  id as entity_id,
  COALESCE(name_en, name_ru) as title,
  name_en as title_en,
  name_ru as title_ru,
  price,
  COALESCE(currency, 'THB') as currency,
  NULL as location,
  provider_id,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END as trust_level,
  is_active
FROM public.services
WHERE is_active = true

UNION ALL

-- Yachts
SELECT 
  'yacht' as entity_type,
  id as entity_id,
  COALESCE(name_en, name_ru) as title,
  name_en as title_en,
  name_ru as title_ru,
  NULL::numeric as price,
  COALESCE(currency, 'THB') as currency,
  NULL as location,
  provider_id,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END as trust_level,
  is_active
FROM public.yachts
WHERE is_active = true

UNION ALL

-- Vehicles (Transport)
SELECT 
  'transport' as entity_type,
  id as entity_id,
  COALESCE(name_en, name_ru) as title,
  name_en as title_en,
  name_ru as title_ru,
  price_per_day as price,
  COALESCE(currency, 'THB') as currency,
  NULL as location,
  provider_id,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END as trust_level,
  is_active
FROM public.vehicles
WHERE is_active = true

UNION ALL

-- Tours
SELECT 
  'tour' as entity_type,
  id as entity_id,
  COALESCE(title_en, title_ru) as title,
  title_en,
  title_ru,
  price,
  COALESCE(currency, 'THB') as currency,
  NULL as location,
  provider_id,
  'verified'::text as trust_level,
  is_active
FROM public.tours
WHERE is_active = true

UNION ALL

-- Experiences
SELECT 
  'experience' as entity_type,
  id as entity_id,
  COALESCE(title_en, title_ru) as title,
  title_en,
  title_ru,
  price,
  COALESCE(currency, 'THB') as currency,
  NULL as location,
  provider_id,
  'verified'::text as trust_level,
  is_active
FROM public.experiences
WHERE is_active = true;

-- 3. Create enhanced LIFE OS resolver RPC with role and locale support
CREATE OR REPLACE FUNCTION public.resolve_life_os_context(
  p_life_code text,
  p_user_role text DEFAULT 'guest',
  p_locale text DEFAULT 'en',
  p_limit int DEFAULT 50
)
RETURNS TABLE(
  entity_type text,
  entity_id uuid,
  title text,
  title_localized text,
  price numeric,
  currency text,
  location text,
  provider_id uuid,
  trust_level text,
  weight int,
  role_scope text[],
  rules jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    clm.entity_type,
    clm.entity_id,
    loc.title,
    CASE 
      WHEN p_locale = 'ru' THEN COALESCE(loc.title_ru, loc.title_en, loc.title)
      ELSE COALESCE(loc.title_en, loc.title_ru, loc.title)
    END as title_localized,
    loc.price,
    loc.currency,
    loc.location,
    loc.provider_id,
    loc.trust_level,
    clm.weight,
    clm.role_scope,
    clm.rules
  FROM catalog_life_map clm
  INNER JOIN life_situations ls ON ls.id = clm.life_situation_id
  LEFT JOIN life_os_catalog loc ON loc.entity_type = clm.entity_type AND loc.entity_id = clm.entity_id
  WHERE ls.code = p_life_code
    AND ls.is_active = true
    AND (clm.role_scope IS NULL OR p_user_role = ANY(clm.role_scope))
    AND (loc.is_active = true OR loc.entity_id IS NULL)
  ORDER BY 
    clm.weight DESC,
    CASE WHEN loc.trust_level = 'verified' THEN 0 ELSE 1 END,
    loc.price ASC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- 4. Grant permissions
GRANT SELECT ON public.life_os_catalog TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_life_os_context TO anon, authenticated;

-- 5. Add documentation comments
COMMENT ON VIEW public.life_os_catalog IS 'LIFE OS: Unified read-only catalog aggregating all platform entities for contextual resolution. DO NOT MODIFY - this is a meta-layer view.';
COMMENT ON FUNCTION public.resolve_life_os_context IS 'LIFE OS: Resolver function returning ranked catalog items based on life situation context, user role, and locale. Supports AI orchestration.';
COMMENT ON COLUMN public.catalog_life_map.role_scope IS 'LIFE OS: Array of user roles (guest/resident/owner/investor) for which this mapping applies';