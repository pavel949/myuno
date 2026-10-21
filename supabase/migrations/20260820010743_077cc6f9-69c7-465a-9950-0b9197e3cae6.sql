-- ============================================================================
-- Real-estate domain structure: developer > project > unit
-- Adds the missing indexes, a canonical linkage view and documents which
-- table owns which level (incl. deprecated duplicates).
-- No table is merged or dropped here.
-- ============================================================================

-- 1. Indexes on the domain links -------------------------------------------
CREATE INDEX IF NOT EXISTS idx_properties_project_id ON public.properties(project_id);
CREATE INDEX IF NOT EXISTS idx_properties_complex_id ON public.properties(complex_id);
CREATE INDEX IF NOT EXISTS idx_project_units_project_id ON public.project_units(project_id);
CREATE INDEX IF NOT EXISTS idx_project_units_property_id ON public.project_units(property_id);
CREATE INDEX IF NOT EXISTS idx_development_units_development_id ON public.development_units(development_id);
CREATE INDEX IF NOT EXISTS idx_resale_properties_development_id ON public.resale_properties(development_id);
CREATE INDEX IF NOT EXISTS idx_property_projects_developer_id ON public.property_projects(developer_id);

-- 2. Canonical project -> developer projection ------------------------------
CREATE OR REPLACE VIEW public.v_real_estate_projects AS
SELECT
  pp.id                AS project_id,
  pp.slug              AS project_slug,
  pp.name_en           AS project_name_en,
  pp.name_ru           AS project_name_ru,
  pp.city_id,
  pp.developer_id,
  d.slug               AS developer_slug,
  COALESCE(d.display_name, d.name_en) AS developer_name_en,
  d.name_ru            AS developer_name_ru,
  pp.developer_name    AS developer_name_legacy,
  (pp.developer_id IS NOT NULL) AS has_developer_link
FROM public.property_projects pp
LEFT JOIN public.developers d ON d.id = pp.developer_id;

ALTER VIEW public.v_real_estate_projects SET (security_invoker = on);

-- 3. Canonical unit -> project -> developer chain ---------------------------
-- `unit_source` names the table a row came from, so callers can always trace
-- a unit back to its owning table without guessing.
CREATE OR REPLACE VIEW public.v_real_estate_domain_chain AS
SELECT
  'properties'::text AS unit_source,
  p.id               AS unit_id,
  COALESCE(p.title_en, p.title_ru) AS unit_label,
  p.unit_number,
  p.status::text     AS unit_status,
  p.city_id,
  p.project_id,
  pp.developer_id,
  (p.project_id IS NOT NULL) AS is_linked_to_project
FROM public.properties p
LEFT JOIN public.property_projects pp ON pp.id = p.project_id

UNION ALL

SELECT
  'project_units'::text,
  pu.id,
  pu.unit_code,
  pu.unit_code,
  COALESCE(pu.unit_status::text, pu.status::text),
  NULL::uuid,
  pu.project_id,
  pp.developer_id,
  (pu.project_id IS NOT NULL)
FROM public.project_units pu
LEFT JOIN public.property_projects pp ON pp.id = pu.project_id

UNION ALL

SELECT
  'development_units'::text,
  du.id,
  COALESCE(du.name, du.name_ru),
  NULL::text,
  du.status::text,
  du.city_id,
  du.development_id,
  pp.developer_id,
  (du.development_id IS NOT NULL)
FROM public.development_units du
LEFT JOIN public.property_projects pp ON pp.id = du.development_id

UNION ALL

SELECT
  'resale_properties'::text,
  rp.id,
  COALESCE(rp.title, rp.title_ru),
  rp.unit_reference,
  rp.status::text,
  rp.city_id,
  rp.development_id,
  pp.developer_id,
  (rp.development_id IS NOT NULL)
FROM public.resale_properties rp
LEFT JOIN public.property_projects pp ON pp.id = rp.development_id;

ALTER VIEW public.v_real_estate_domain_chain SET (security_invoker = on);

GRANT SELECT ON public.v_real_estate_projects TO anon, authenticated;
GRANT SELECT ON public.v_real_estate_domain_chain TO authenticated;
GRANT ALL ON public.v_real_estate_projects TO service_role;
GRANT ALL ON public.v_real_estate_domain_chain TO service_role;

-- 4. Document the three canonical levels ------------------------------------
COMMENT ON TABLE public.developers IS
  'DOMAIN LEVEL 1 (developer). Canonical developer/company entity. Projects link here via property_projects.developer_id.';
COMMENT ON TABLE public.property_projects IS
  'DOMAIN LEVEL 2 (project/development). Canonical project entity: newbuild complexes, villa developments, off-plan phases. Parent = developers. Children = properties.project_id, project_units.project_id, resale_properties.development_id.';
COMMENT ON TABLE public.properties IS
  'DOMAIN LEVEL 3 (unit). Canonical rentable/sellable unit (condo, villa, house). Link to its project through project_id; developer is derived through the project, never stored here.';
COMMENT ON TABLE public.project_units IS
  'DOMAIN LEVEL 3 (unit) — sales inventory view of a project unit (availability, holds, sold-to). Links to property_projects.project_id and optionally to the listing row via property_id.';
COMMENT ON TABLE public.resale_properties IS
  'DOMAIN LEVEL 3 (unit) — secondary-market unit with asking price/assignment premium. Links to its project via development_id.';
COMMENT ON TABLE public.development_units IS
  'DEPRECATED duplicate of DOMAIN LEVEL 3 (unit): use project_units for sales inventory and properties for listings. Kept read-only for legacy developer-module screens; do not add new writers.';
COMMENT ON TABLE public.property_complexes IS
  'DEPRECATED duplicate of DOMAIN LEVEL 2 (project): use property_projects. Kept only for legacy properties.complex_id references; do not add new writers.';

COMMENT ON COLUMN public.properties.project_id IS
  'Canonical link to DOMAIN LEVEL 2 (property_projects). Null means the unit is standalone / not yet attached to a project.';
COMMENT ON COLUMN public.properties.complex_id IS
  'DEPRECATED: legacy link to property_complexes. Prefer project_id.';
COMMENT ON COLUMN public.property_projects.developer_id IS
  'Canonical link to DOMAIN LEVEL 1 (developers). developer_name is a legacy free-text fallback.';
COMMENT ON COLUMN public.project_units.property_id IS
  'Optional link from sales inventory to the public listing row in properties (same physical unit).';

COMMENT ON VIEW public.v_real_estate_domain_chain IS
  'Canonical unit -> project -> developer chain across all unit-level tables. unit_source names the owning table; is_linked_to_project flags orphan units that need attaching.';
COMMENT ON VIEW public.v_real_estate_projects IS
  'Canonical project -> developer projection with resolved developer names.';