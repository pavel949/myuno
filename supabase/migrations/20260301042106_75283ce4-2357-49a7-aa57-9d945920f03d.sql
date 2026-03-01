
-- Expand property_complexes with classification, location, media, amenities, services, management
ALTER TABLE public.property_complexes
  ADD COLUMN IF NOT EXISTS complex_type text DEFAULT 'condo',
  ADD COLUMN IF NOT EXISTS total_units integer,
  ADD COLUMN IF NOT EXISTS total_buildings integer,
  ADD COLUMN IF NOT EXISTS year_built integer,
  ADD COLUMN IF NOT EXISTS total_floors integer,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_ru text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS cover_image text,
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS services text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS security_features text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS infrastructure text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS management_company_id uuid REFERENCES public.management_companies(id),
  ADD COLUMN IF NOT EXISTS cam_fee_per_sqm numeric,
  ADD COLUMN IF NOT EXISTS cam_includes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS juristic_person_name text,
  ADD COLUMN IF NOT EXISTS juristic_phone text,
  ADD COLUMN IF NOT EXISTS juristic_email text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_complex_amenities ON property_complexes USING GIN (amenities);
CREATE INDEX IF NOT EXISTS idx_complex_services ON property_complexes USING GIN (services);
CREATE INDEX IF NOT EXISTS idx_complex_security ON property_complexes USING GIN (security_features);
CREATE INDEX IF NOT EXISTS idx_complex_infrastructure ON property_complexes USING GIN (infrastructure);
CREATE INDEX IF NOT EXISTS idx_complex_mc ON property_complexes (management_company_id);
CREATE INDEX IF NOT EXISTS idx_complex_type ON property_complexes (complex_type);

-- RLS policies for property_complexes
ALTER TABLE property_complexes ENABLE ROW LEVEL SECURITY;

-- Public can read active complexes
DROP POLICY IF EXISTS "Public can view active complexes" ON property_complexes;
CREATE POLICY "Public can view active complexes"
  ON property_complexes FOR SELECT
  USING (is_active = true);

-- Owner can manage their complexes
DROP POLICY IF EXISTS "Owner can manage complexes" ON property_complexes;
CREATE POLICY "Owner can manage complexes"
  ON property_complexes FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- MC members can manage complexes linked to their company
DROP POLICY IF EXISTS "MC members can manage company complexes" ON property_complexes;
CREATE POLICY "MC members can manage company complexes"
  ON property_complexes FOR ALL
  USING (management_company_id IN (SELECT get_user_company_ids()))
  WITH CHECK (management_company_id IN (SELECT get_user_company_ids()));

-- Admins can manage all
DROP POLICY IF EXISTS "Admins manage all complexes" ON property_complexes;
CREATE POLICY "Admins manage all complexes"
  ON property_complexes FOR ALL
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());
