-- Phase 1: ClearView rating flag for off-plan projects
ALTER TABLE public.property_projects
  ADD COLUMN IF NOT EXISTS is_clearview_rated boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_property_projects_clearview_rated
  ON public.property_projects(is_clearview_rated) WHERE is_active = true;

COMMENT ON COLUMN public.property_projects.is_clearview_rated IS
  'When false, the project is brokered/curated only — no ClearView V3 score has been independently calculated. Used to show "Not ClearView rated" disclosure on public cards/details.';

-- Mark known brokered/curated projects as not ClearView-rated.
UPDATE public.property_projects
   SET is_clearview_rated = false
 WHERE name_en ILIKE '%peylaa%'
    OR slug ILIKE 'peylaa-%'
    OR name_en ILIKE '%siamese%bangtao%'
    OR slug ILIKE 'siamese-bangtao-%'
    OR name_en ILIKE '%nunyan%';