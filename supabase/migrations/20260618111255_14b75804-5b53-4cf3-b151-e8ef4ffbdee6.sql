-- ============================================================
-- Wave 2 / A1: TH localization columns
-- ============================================================
ALTER TABLE public.life_situations
  ADD COLUMN IF NOT EXISTS title_th text,
  ADD COLUMN IF NOT EXISTS description_th text;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS name_th text,
  ADD COLUMN IF NOT EXISTS description_th text;

ALTER TABLE public.category_groups
  ADD COLUMN IF NOT EXISTS name_th text,
  ADD COLUMN IF NOT EXISTS description_th text;

-- ============================================================
-- Wave 2 / B2: communities module
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.community_kind AS ENUM ('religion','club','consulate','meetup');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.religion_branch AS ENUM (
    'buddhist','christian_catholic','christian_orthodox','christian_protestant',
    'muslim','jewish','hindu','sikh','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  kind public.community_kind NOT NULL,
  -- localized names & descriptions
  name_en text NOT NULL,
  name_ru text,
  name_th text,
  description_en text,
  description_ru text,
  description_th text,
  -- typology
  religion public.religion_branch,
  country_code text,                         -- ISO-2 for consulates: RU, GB, DE, etc.
  consulate_type text,                       -- embassy | consulate_general | honorary
  language_primary text,                     -- en, ru, th, de, fr, ...
  tags text[] DEFAULT '{}'::text[],
  -- location
  address text,
  city text,
  province text DEFAULT 'Phuket',
  lat numeric,
  lng numeric,
  google_place_id text,
  -- contacts
  phone text,
  email text,
  website text,
  whatsapp text,
  telegram text,
  social_links jsonb DEFAULT '{}'::jsonb,
  -- schedule: { mon:["09:00-17:00"], sun:["08:00","10:00"], notes:"…" }
  schedule jsonb,
  -- media
  cover_image_url text,
  gallery jsonb DEFAULT '[]'::jsonb,
  -- meta
  source_url text,
  verified_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communities_kind     ON public.communities(kind) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_communities_country  ON public.communities(country_code) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_communities_religion ON public.communities(religion) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_communities_geo      ON public.communities(lat, lng) WHERE is_active;

-- Grants (publicly readable directory, admin-only writes)
GRANT SELECT ON public.communities TO anon, authenticated;
GRANT ALL    ON public.communities TO service_role;

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "communities_public_read"
  ON public.communities FOR SELECT
  USING (is_active = true);

CREATE POLICY "communities_admin_insert"
  ON public.communities FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "communities_admin_update"
  ON public.communities FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "communities_admin_delete"
  ON public.communities FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_communities_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS communities_set_updated_at ON public.communities;
CREATE TRIGGER communities_set_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.tg_communities_updated_at();

-- ============================================================
-- B2.1: register communities as a category + life_situation
-- ============================================================
INSERT INTO public.categories (slug, name_en, name_ru, name_th, group_id, icon, sort_order, is_active, status)
SELECT 'communities', 'Communities & Consulates', 'Сообщества и консульства', 'ชุมชนและสถานกงสุล',
       g.id, 'Users', 50, true, 'available'
FROM public.category_groups g WHERE g.slug = 'live'
ON CONFLICT (slug) DO UPDATE SET name_th = EXCLUDED.name_th;

INSERT INTO public.life_situations (code, title_en, title_ru, title_th, description_en, description_ru, description_th, icon, priority, is_active)
VALUES (
  'community',
  'Find your community',
  'Найти своих',
  'หาชุมชนของคุณ',
  'Churches, expat clubs, consulates, meetups',
  'Церкви, клубы экспатов, консульства, встречи',
  'โบสถ์ ชมรมชาวต่างชาติ สถานกงสุล กิจกรรม',
  'Users', 70, true
)
ON CONFLICT (code) DO UPDATE
  SET title_th = EXCLUDED.title_th,
      description_th = EXCLUDED.description_th,
      is_active = true;

INSERT INTO public.cluster_life_situations (cluster_id, life_situation_id, weight, is_primary)
SELECT g.id, ls.id, 80, true
FROM public.category_groups g
JOIN public.life_situations ls ON ls.code = 'community'
WHERE g.slug = 'live'
ON CONFLICT (cluster_id, life_situation_id) DO NOTHING;
