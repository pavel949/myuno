
-- Phase 1: Enrich property_projects with sales/CRM columns
ALTER TABLE public.property_projects
  ADD COLUMN IF NOT EXISTS commission_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_plan JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS marketing_materials TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exclusive BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS management_company_id UUID,
  ADD COLUMN IF NOT EXISTS contact_id UUID,
  ADD COLUMN IF NOT EXISTS min_price_per_sqm NUMERIC,
  ADD COLUMN IF NOT EXISTS ownership_types TEXT[] DEFAULT '{}';

-- Phase 1b: project_units table
CREATE TABLE public.project_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES property_projects(id) ON DELETE CASCADE,
  unit_code TEXT,
  unit_type TEXT NOT NULL,
  floor INT,
  area_sqm NUMERIC,
  bedrooms INT,
  bathrooms INT,
  price NUMERIC,
  currency TEXT DEFAULT 'THB',
  price_per_sqm NUMERIC,
  status TEXT DEFAULT 'available' CHECK (status IN ('available','reserved','sold','held')),
  view_type TEXT,
  floor_plan_url TEXT,
  property_id UUID REFERENCES properties(id),
  buyer_contact_id UUID REFERENCES crm_contacts(id),
  deal_id UUID REFERENCES agent_deals(id),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for project_units
ALTER TABLE public.project_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read project_units"
  ON public.project_units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert project_units"
  ON public.project_units FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update project_units"
  ON public.project_units FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Creators can delete project_units"
  ON public.project_units FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR auth.uid() IS NOT NULL);

-- Index for fast project lookups
CREATE INDEX idx_project_units_project_id ON public.project_units(project_id);
CREATE INDEX idx_project_units_status ON public.project_units(status);

-- Phase 2: nb_leads CRM integration
ALTER TABLE public.nb_leads
  ADD COLUMN IF NOT EXISTS crm_contact_id UUID;

-- Timestamp trigger for project_units
CREATE TRIGGER update_project_units_updated_at
  BEFORE UPDATE ON public.project_units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
