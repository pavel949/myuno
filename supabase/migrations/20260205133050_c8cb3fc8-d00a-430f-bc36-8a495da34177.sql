
-- Drop and recreate the function with proper type casting
DROP FUNCTION IF EXISTS resolve_life_os_context(text, text, text, integer);

CREATE FUNCTION public.resolve_life_os_context(
  p_life_code text,
  p_user_role text DEFAULT 'guest',
  p_locale text DEFAULT 'en',
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  entity_type text,
  entity_id text,
  title text,
  title_localized text,
  price numeric,
  currency text,
  location text,
  provider_id text,
  trust_level text,
  weight integer,
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
    clm.entity_id::text,
    loc.title,
    CASE 
      WHEN p_locale = 'ru' THEN COALESCE(loc.title_ru, loc.title)
      ELSE COALESCE(loc.title, loc.title_ru)
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
  LEFT JOIN life_os_catalog loc ON loc.entity_type = clm.entity_type AND loc.entity_id = clm.entity_id::text
  WHERE ls.code = p_life_code
    AND ls.is_active = true
    AND (clm.role_scope IS NULL OR p_user_role = ANY(clm.role_scope))
  ORDER BY 
    clm.weight DESC,
    CASE WHEN loc.trust_level = 'verified' THEN 0 ELSE 1 END,
    loc.price ASC NULLS LAST
  LIMIT p_limit;
END;
$$;
