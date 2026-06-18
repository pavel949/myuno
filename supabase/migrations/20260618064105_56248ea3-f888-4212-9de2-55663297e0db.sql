
-- Wave 1: Navigator audit fixes — remove broken mappings, unify count/resolve

-- 1. Remove mappings to entity types without renderable detail pages
DELETE FROM public.catalog_life_map
WHERE entity_type IN ('pharmacy', 'page', 'bank');

-- 2. Resolve: INNER JOIN view (eliminates empty cards), unify role_scope filter, higher limit
CREATE OR REPLACE FUNCTION public.resolve_life_os_context(
  p_life_code text,
  p_user_role text DEFAULT 'guest',
  p_locale text DEFAULT 'en',
  p_limit integer DEFAULT 200
)
RETURNS TABLE(
  entity_type text, entity_id text, title text, title_localized text,
  price numeric, currency text, location text, provider_id text,
  trust_level text, weight integer, role_scope text[], rules jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    clm.entity_type,
    clm.entity_id::text,
    loc.title,
    CASE WHEN p_locale = 'ru' THEN COALESCE(loc.title_ru, loc.title)
         ELSE COALESCE(loc.title, loc.title_ru) END AS title_localized,
    loc.price,
    loc.currency,
    loc.location,
    loc.provider_id,
    loc.trust_level,
    clm.weight,
    clm.role_scope,
    clm.rules
  FROM public.catalog_life_map clm
  INNER JOIN public.life_situations ls
    ON ls.id = clm.life_situation_id AND ls.is_active = true
  INNER JOIN public.life_os_catalog loc
    ON loc.entity_type = clm.entity_type AND loc.entity_id = clm.entity_id::text
  WHERE ls.code = p_life_code
    AND (
      clm.role_scope IS NULL
      OR array_length(clm.role_scope, 1) IS NULL
      OR p_user_role = ANY(clm.role_scope)
    )
  ORDER BY
    clm.weight DESC,
    CASE WHEN loc.trust_level = 'verified' THEN 0 ELSE 1 END,
    loc.price ASC NULLS LAST
  LIMIT p_limit;
END;
$function$;

-- 3. Count: same INNER JOIN so counter == list length exactly
CREATE OR REPLACE FUNCTION public.count_life_os_context(
  p_user_role text DEFAULT 'guest'
)
RETURNS TABLE(life_situation_id uuid, item_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    clm.life_situation_id,
    count(*)::bigint AS item_count
  FROM public.catalog_life_map clm
  INNER JOIN public.life_situations ls
    ON ls.id = clm.life_situation_id AND ls.is_active = true
  INNER JOIN public.life_os_catalog loc
    ON loc.entity_type = clm.entity_type AND loc.entity_id = clm.entity_id::text
  WHERE
    clm.role_scope IS NULL
    OR array_length(clm.role_scope, 1) IS NULL
    OR p_user_role = ANY(clm.role_scope)
  GROUP BY clm.life_situation_id;
$function$;

GRANT EXECUTE ON FUNCTION public.resolve_life_os_context(text, text, text, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.count_life_os_context(text) TO anon, authenticated, service_role;
