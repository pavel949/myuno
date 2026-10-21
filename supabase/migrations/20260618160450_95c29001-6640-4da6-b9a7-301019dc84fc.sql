-- =====================================================
-- Phase 1 — Multi-location foundation
-- Step 1: city_id FK on domain tables + backfill to Phuket
-- Step 2: city_areas, city_content, cities.metadata
-- =====================================================

-- ---- Step 2a: extend cities ----
ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ---- Step 1: add city_id to domain tables ----
-- Helper: get phuket id once
DO $$
DECLARE
  v_phuket_id uuid;
  v_table text;
  v_tables text[] := ARRAY[
    'properties','property_projects','property_complexes','project_units','development_units','resale_properties',
    'providers','marketplace_vendors','listings','business_listings','user_listings',
    'salons','gyms','flower_shops','pharmacies','veterinary_clinics','doctors','education_providers','insurance_providers',
    'events','venues','water_activities','transfers','airport_services',
    'legal_services','medical_services','visa_services','cleaning_services',
    'developers','management_companies','crm_companies','crm_contacts',
    'official_news','platform_news','lead_magnets','magnet_landings',
    'phuket_osm_pois'
  ];
BEGIN
  SELECT id INTO v_phuket_id FROM public.cities WHERE slug = 'phuket';
  IF v_phuket_id IS NULL THEN
    RAISE EXCEPTION 'Phuket city row not found in public.cities';
  END IF;

  FOREACH v_table IN ARRAY v_tables LOOP
    -- skip if table doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema='public' AND table_name = v_table
    ) THEN
      RAISE NOTICE 'Skip missing table: %', v_table;
      CONTINUE;
    END IF;

    -- add column if missing
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id) ON DELETE RESTRICT',
      v_table
    );

    -- backfill nulls to phuket
    EXECUTE format(
      'UPDATE public.%I SET city_id = %L WHERE city_id IS NULL',
      v_table, v_phuket_id
    );

    -- index
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I(city_id)',
      'idx_' || v_table || '_city_id', v_table
    );
  END LOOP;
END $$;

-- ---- Step 2b: city_areas ----
CREATE TABLE IF NOT EXISTS public.city_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name_en text NOT NULL,
  name_ru text,
  name_th text,
  lat numeric(10,7),
  lng numeric(10,7),
  bounds jsonb,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city_id, slug)
);

GRANT SELECT ON public.city_areas TO anon, authenticated;
GRANT ALL ON public.city_areas TO service_role;
ALTER TABLE public.city_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "city_areas public read"
  ON public.city_areas FOR SELECT
  USING (true);

CREATE POLICY "city_areas admin write"
  ON public.city_areas FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_city_areas_city_id ON public.city_areas(city_id);

-- ---- Step 2c: city_content ----
CREATE TABLE IF NOT EXISTS public.city_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  key text NOT NULL,
  value_en text,
  value_ru text,
  value_th text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city_id, key)
);

GRANT SELECT ON public.city_content TO anon, authenticated;
GRANT ALL ON public.city_content TO service_role;
ALTER TABLE public.city_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "city_content public read"
  ON public.city_content FOR SELECT
  USING (true);

CREATE POLICY "city_content admin write"
  ON public.city_content FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_city_content_city_key ON public.city_content(city_id, key);

-- ---- updated_at triggers ----
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname='update_updated_at_column') THEN
    CREATE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $f$
    BEGIN NEW.updated_at = now(); RETURN NEW; END;
    $f$ LANGUAGE plpgsql SET search_path = public;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_city_areas_updated_at ON public.city_areas;
CREATE TRIGGER trg_city_areas_updated_at
  BEFORE UPDATE ON public.city_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_city_content_updated_at ON public.city_content;
CREATE TRIGGER trg_city_content_updated_at
  BEFORE UPDATE ON public.city_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();