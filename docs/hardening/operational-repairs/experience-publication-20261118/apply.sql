-- MANUAL ONLY. Review and explicit production activation required. Never auto-run at deployment.
BEGIN;
-- BEGIN FIXTURE experience-public-rls-proposal.sql
ALTER POLICY listings_public_read ON public.listings
USING (
  is_active = true
  AND (approval_status = 'approved' OR approval_status IS NULL)
  AND (
    vertical <> 'experience'
    OR (
      approval_status = 'approved'
      AND attributes->>'status' = 'published'
      AND lower(btrim(COALESCE(attributes->>'operating_status', ''))) NOT IN
        ('temporarily_closed', 'permanently_closed', 'closed')
    )
  )
);
-- END FIXTURE experience-public-rls-proposal.sql

-- BEGIN FIXTURE experience-rpc-public-proposal.sql
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
$function$;

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
$function$;
-- END FIXTURE experience-rpc-public-proposal.sql

-- BEGIN FIXTURE listings-provider-update-proposal.sql
CREATE FUNCTION public.guard_listing_provider_privileged_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  -- JWT metadata is not used. current_user is the actual database role.
  -- Service/DB roles retain their existing trusted maintenance capabilities.
  IF current_user = 'authenticated'
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    -- Fail closed for current and future system columns; ordinary listing content is editable.
    -- updated_at is maintained by the existing timestamp trigger, not an authority field.
    IF (to_jsonb(NEW) - ARRAY[
        'name_en','name_ru','description_en','description_ru','cover_image','images',
        'address','district','lat','lng','price','price_period','currency','phone',
        'email','website','working_hours','tags','features','languages','attributes','updated_at'
      ]::text[]) IS DISTINCT FROM (to_jsonb(OLD) - ARRAY[
        'name_en','name_ru','description_en','description_ru','cover_image','images',
        'address','district','lat','lng','price','price_period','currency','phone',
        'email','website','working_hours','tags','features','languages','attributes','updated_at'
      ]::text[]) THEN
      RAISE EXCEPTION 'Only an administrator can change listing identity, ownership or system fields' USING ERRCODE = '42501';
    END IF;
    IF NEW.attributes IS DISTINCT FROM OLD.attributes THEN
      IF jsonb_typeof(NEW.attributes) IS DISTINCT FROM 'object'
         OR (OLD.attributes IS NOT NULL AND jsonb_typeof(OLD.attributes) <> 'object') THEN
        RAISE EXCEPTION 'Listing attributes must be an object' USING ERRCODE = '42501';
      END IF;
      -- Only descriptive provider content may change. Unknown/new keys remain administrator-owned.
      -- Publication, operating status, routing, commission, verification, provenance, tokens and
      -- all other non-allowlisted keys must remain byte-for-byte semantically unchanged.
      IF (NEW.attributes - ARRAY[
          'short_description','short_description_en','short_description_ru','description_short',
          'long_description','highlights','includes','inclusions','excludes','exclusions',
          'exclusions_en','exclusions_ru','requirements','duration_hours','duration_minutes',
          'max_participants','min_participants','age_restriction','difficulty','itinerary',
          'opening_hours_note','location_name','location_ru','gallery_image_urls','hero_image_url'
        ]::text[]) IS DISTINCT FROM (coalesce(OLD.attributes,'{}'::jsonb) - ARRAY[
          'short_description','short_description_en','short_description_ru','description_short',
          'long_description','highlights','includes','inclusions','excludes','exclusions',
          'exclusions_en','exclusions_ru','requirements','duration_hours','duration_minutes',
          'max_participants','min_participants','age_restriction','difficulty','itinerary',
          'opening_hours_note','location_name','location_ru','gallery_image_urls','hero_image_url'
        ]::text[]) THEN
        RAISE EXCEPTION 'Only an administrator can change listing operational attributes' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
-- A trigger function cannot be used as an ordinary RPC; still remove unnecessary direct grants.
REVOKE ALL ON FUNCTION public.guard_listing_provider_privileged_update() FROM PUBLIC;
CREATE TRIGGER guard_listing_provider_privileged_update
BEFORE UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.guard_listing_provider_privileged_update();
ALTER POLICY listings_provider_update ON public.listings
USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()))
WITH CHECK (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));
-- END FIXTURE listings-provider-update-proposal.sql
COMMIT;
