-- =============================================================
-- Developer Module | Migration 02: Extend property_projects
--
-- Adds Developer Module-specific columns to the existing
-- property_projects table. All existing columns are preserved.
-- Duplicate-name columns are aliased with _thb / _meta / _template
-- suffixes to avoid conflicts with existing catalog columns.
-- =============================================================

ALTER TABLE public.property_projects
  -- Developer Module public visibility flag (separate from is_active)
  ADD COLUMN IF NOT EXISTS public_listing_enabled  boolean    DEFAULT false,

  -- Construction phase (spec values; existing project_status uses different values — both coexist)
  ADD COLUMN IF NOT EXISTS construction_phase      text
    CHECK (construction_phase IN ('planning','foundation','structure','mep','finishing','handover','completed')),

  -- Unit counts (available_units is new; total_units already exists in original schema)
  ADD COLUMN IF NOT EXISTS available_units         integer,

  -- THB-denominated prices (price_from / price_to already exist without _thb suffix)
  ADD COLUMN IF NOT EXISTS price_from_thb          numeric,
  ADD COLUMN IF NOT EXISTS price_to_thb            numeric,

  -- Foreign quota tracking (system-enforced, per spec R7)
  ADD COLUMN IF NOT EXISTS foreign_quota_used_pct  numeric    DEFAULT 0,
  ADD COLUMN IF NOT EXISTS foreign_units_sold      integer    DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thai_units_sold         integer    DEFAULT 0,

  -- cover_image_url is new; existing cover_image TEXT column is kept
  ADD COLUMN IF NOT EXISTS cover_image_url         text,

  -- gallery_urls TEXT[] already exists — no-op
  ADD COLUMN IF NOT EXISTS gallery_urls            text[],

  -- video_url already exists — no-op
  ADD COLUMN IF NOT EXISTS video_url               text,
  ADD COLUMN IF NOT EXISTS virtual_tour_url        text,

  -- description_en / description_ru already exist — no-op
  ADD COLUMN IF NOT EXISTS description_en          text,
  ADD COLUMN IF NOT EXISTS description_ru          text,

  -- Structured amenities (existing amenities TEXT[] is kept; this is JSONB enrichment)
  ADD COLUMN IF NOT EXISTS amenities_meta          jsonb,

  -- Precise coords (existing lat/lng kept; these are aliased for developer module)
  ADD COLUMN IF NOT EXISTS location_lat            numeric,
  ADD COLUMN IF NOT EXISTS location_lng            numeric,

  -- district already exists — no-op
  ADD COLUMN IF NOT EXISTS district                text,

  -- Payment plan template for auto-generating schedules (payment_plan JSONB already exists)
  ADD COLUMN IF NOT EXISTS payment_plan_template   jsonb,

  -- Document library (EIAs, permits, brochures)
  ADD COLUMN IF NOT EXISTS documents_urls          jsonb;

-- Indexes for Developer Module queries
CREATE INDEX IF NOT EXISTS idx_devmod_projects_developer
  ON public.property_projects(developer_id);

CREATE INDEX IF NOT EXISTS idx_devmod_projects_slug
  ON public.property_projects(slug) WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_devmod_projects_public_listing
  ON public.property_projects(public_listing_enabled)
  WHERE public_listing_enabled = true;
