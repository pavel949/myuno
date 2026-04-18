-- 1. Developer slug helpers ---------------------------------------------------

CREATE OR REPLACE FUNCTION public.slugify_text(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' FROM
    regexp_replace(
      regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'),
      '-+', '-', 'g'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.developers_set_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  i int := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND length(trim(NEW.slug)) > 0 THEN
    RETURN NEW;
  END IF;

  base := public.slugify_text(coalesce(NEW.name_en, NEW.name_ru, ''));
  IF base IS NULL OR base = '' THEN
    base := 'developer';
  END IF;

  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.developers WHERE slug = candidate AND id <> NEW.id) LOOP
    i := i + 1;
    candidate := base || '-' || i;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_developers_set_slug ON public.developers;
CREATE TRIGGER trg_developers_set_slug
  BEFORE INSERT OR UPDATE OF name_en, name_ru, slug
  ON public.developers
  FOR EACH ROW
  EXECUTE FUNCTION public.developers_set_slug();

-- Backfill missing slugs (86/126). Loop one row at a time so the trigger
-- handles uniqueness and we don't fight ourselves on bulk update.
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id FROM public.developers WHERE slug IS NULL OR length(trim(slug)) = 0
  LOOP
    UPDATE public.developers SET slug = NULL, updated_at = now() WHERE id = rec.id;
  END LOOP;
END $$;

-- 2. Tighten v_properties_public (Supabase linter ERROR 0010) -----------------

ALTER VIEW public.v_properties_public SET (security_invoker = on);

-- 3. Drop redundant nb_leads INSERT policy (Anon insert already covers all) ---

DROP POLICY IF EXISTS "Authenticated insert nb_leads" ON public.nb_leads;
