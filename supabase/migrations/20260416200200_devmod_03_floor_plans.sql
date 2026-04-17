-- =============================================================
-- Developer Module | Migration 03: floor_plans + extend project_units
--
-- Creates the floor_plans table (floor/level images for the Digital
-- Master Plan) and extends project_units with pin coordinates,
-- Developer-Module unit status state machine, and sale tracking.
--
-- Existing project_units columns (status, floor, area_sqm, price) are
-- preserved. Developer Module introduces parallel columns (unit_status,
-- floor_number, size_sqm, price_thb) to avoid breaking the existing CRM.
-- =============================================================

-- -------------------------------------------------------------
-- 1. CREATE floor_plans
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.floor_plans (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid        NOT NULL REFERENCES public.property_projects(id) ON DELETE CASCADE,
  name            text        NOT NULL,               -- "Floor 1", "Penthouse", "Villa Zone"
  display_order   integer     DEFAULT 0,
  image_url       text        NOT NULL,
  image_width_px  integer     NOT NULL,
  image_height_px integer     NOT NULL,
  scale_reference jsonb,                              -- {point_a:{x,y}, point_b:{x,y}, distance_m:N}
  version         integer     DEFAULT 1,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devmod_floor_plans_project
  ON public.floor_plans(project_id, display_order);

ALTER TABLE public.floor_plans ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE TRIGGER devmod_floor_plans_updated_at
  BEFORE UPDATE ON public.floor_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------
-- 2. EXTEND project_units with Developer Module fields
-- -------------------------------------------------------------

ALTER TABLE public.project_units
  -- Floor plan link and pin positioning (stored as % of image dimensions)
  ADD COLUMN IF NOT EXISTS floor_plan_id         uuid     REFERENCES public.floor_plans(id),
  ADD COLUMN IF NOT EXISTS pin_x_pct             numeric,               -- 0–100, % of image width
  ADD COLUMN IF NOT EXISTS pin_y_pct             numeric,               -- 0–100, % of image height
  ADD COLUMN IF NOT EXISTS pin_logical_m         jsonb,                 -- {x_m, y_m} after scale calibration
  ADD COLUMN IF NOT EXISTS floor_plan_image_url  text,                  -- unit's own floor plan (separate from floor_plans.image_url)

  -- Developer Module unit status (parallel to existing CRM `status` column)
  -- Uses atomic transition via devmod_attempt_unit_transition() function
  ADD COLUMN IF NOT EXISTS unit_status           text     DEFAULT 'available'
    CHECK (unit_status IN ('available','soft_hold','reserved','spa_signed','sold','blocked','not_for_sale')),
  ADD COLUMN IF NOT EXISTS status_version        integer  DEFAULT 1,    -- optimistic concurrency bump

  -- THB-denominated price (existing `price` column is kept)
  ADD COLUMN IF NOT EXISTS price_thb             numeric,

  -- Physical dimensions (existing area_sqm is kept)
  ADD COLUMN IF NOT EXISTS size_sqm              numeric,

  -- Floor number (existing INT `floor` column is kept)
  ADD COLUMN IF NOT EXISTS floor_number          integer,

  -- view_type already exists — no-op
  ADD COLUMN IF NOT EXISTS view_type             text,

  -- Thai property ownership type (required for foreign quota tracking)
  ADD COLUMN IF NOT EXISTS ownership_type        text
    CHECK (ownership_type IN ('freehold','leasehold','thai_quota','foreign_quota')),

  -- Sale attribution
  ADD COLUMN IF NOT EXISTS sold_via_myuno        boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS sold_to_buyer_id      uuid,
  ADD COLUMN IF NOT EXISTS sold_at               timestamptz;

CREATE INDEX IF NOT EXISTS idx_devmod_units_floor_plan
  ON public.project_units(floor_plan_id);

CREATE INDEX IF NOT EXISTS idx_devmod_units_unit_status
  ON public.project_units(unit_status);
