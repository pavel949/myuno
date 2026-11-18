-- REVIEW ONLY. Fix recursive policy without adding read permissions or definer functions.
-- Check no function/trigger of these names exists before migration; use a unique migration name.
BEGIN;
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
COMMIT;
