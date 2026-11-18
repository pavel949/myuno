-- REVIEW ONLY; not applied. Preserves SECURITY DEFINER, signatures, grants, and non-experience semantics.
BEGIN;
CREATE OR REPLACE FUNCTION public.count_life_os_context(p_user_role text DEFAULT 'guest'::text)
 RETURNS TABLE(life_situation_id uuid, item_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
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
  WHERE (
    clm.role_scope IS NULL
    OR array_length(clm.role_scope, 1) IS NULL
    OR p_user_role = ANY(clm.role_scope)
  ) AND (
      loc.entity_type <> 'experience'
      OR EXISTS (
        SELECT 1 FROM public.listings AS public_experience
        WHERE public_experience.id::text = loc.entity_id
          AND public_experience.vertical = 'experience'
          AND public_experience.is_active = true
          AND public_experience.approval_status = 'approved'
          AND public_experience.attributes->>'status' = 'published'
          AND lower(btrim(coalesce(public_experience.attributes->>'operating_status', '')))
              NOT IN ('temporarily_closed', 'permanently_closed', 'closed')
      )
    )
  GROUP BY clm.life_situation_id;
$function$

CREATE OR REPLACE FUNCTION public.resolve_life_os_context(p_life_code text, p_user_role text DEFAULT 'guest'::text, p_locale text DEFAULT 'en'::text, p_limit integer DEFAULT 200)
 RETURNS TABLE(entity_type text, entity_id text, title text, title_localized text, price numeric, currency text, location text, provider_id text, trust_level text, weight integer, role_scope text[], rules jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
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
  WHERE (
      loc.entity_type <> 'experience'
      OR EXISTS (
        SELECT 1 FROM public.listings AS public_experience
        WHERE public_experience.id::text = loc.entity_id
          AND public_experience.vertical = 'experience'
          AND public_experience.is_active = true
          AND public_experience.approval_status = 'approved'
          AND public_experience.attributes->>'status' = 'published'
          AND lower(btrim(coalesce(public_experience.attributes->>'operating_status', '')))
              NOT IN ('temporarily_closed', 'permanently_closed', 'closed')
      )
    )
    AND ls.code = p_life_code
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
$function$

COMMIT;
