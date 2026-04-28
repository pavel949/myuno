-- Phase 6: Frontend ↔ Backend Sync — extend categories/groups with Master Taxonomy fields

-- 1. category_groups: surface flag + canonical surface_id
ALTER TABLE public.category_groups
  ADD COLUMN IF NOT EXISTS is_surface boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS surface_id text,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_ru text;

-- 2. categories: master taxonomy tags + explicit app path
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS jtbd_clusters jtbd_cluster[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS persona_codes app_persona[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS app_path text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'available' 
    CHECK (status IN ('available','soon','pro','beta'));

-- 3. Backfill 6 canonical Surfaces
UPDATE public.category_groups SET is_surface = true, surface_id = slug
  WHERE slug IN ('arrive','live','manage','invest','legal','build');

-- 4. Map remaining sub-groups to a parent surface
UPDATE public.category_groups SET surface_id = 'arrive' WHERE slug IN ('transport','home-living');
UPDATE public.category_groups SET surface_id = 'live'   WHERE slug IN ('leisure','water','health-wellness','life-admin');
UPDATE public.category_groups SET surface_id = 'manage' WHERE slug IN ('home-maintenance','professional');
UPDATE public.category_groups SET surface_id = 'build'  WHERE slug = 'other';

-- 5. Index for fast surface lookups
CREATE INDEX IF NOT EXISTS idx_category_groups_surface ON public.category_groups(surface_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_categories_jtbd ON public.categories USING GIN(jtbd_clusters);
CREATE INDEX IF NOT EXISTS idx_categories_persona ON public.categories USING GIN(persona_codes);