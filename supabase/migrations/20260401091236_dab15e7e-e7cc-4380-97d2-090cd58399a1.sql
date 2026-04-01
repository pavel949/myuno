
-- Development Units (floor plan configurations within a property_project)
CREATE TABLE IF NOT EXISTS public.development_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id uuid NOT NULL REFERENCES public.property_projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ru text,
  unit_type text NOT NULL DEFAULT 'studio',
  area_sqm numeric NOT NULL,
  bedrooms int DEFAULT 0,
  bathrooms int DEFAULT 1,
  floor_from int,
  floor_to int,
  price numeric NOT NULL,
  price_per_sqm numeric,
  total_units int DEFAULT 1,
  available_units int DEFAULT 1,
  floor_plan_url text,
  views text[],
  features text[],
  status text DEFAULT 'available',
  created_at timestamptz DEFAULT now()
);

-- Resale Properties (secondary market + assignments)
CREATE TABLE IF NOT EXISTS public.resale_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_ru text,
  property_type text NOT NULL DEFAULT 'condo',
  development_id uuid REFERENCES public.property_projects(id),
  unit_reference text,
  seller_type text DEFAULT 'owner',
  seller_contact_name text,
  seller_phone text,
  agent_name text,
  agent_company text,
  zone text NOT NULL,
  address text,
  latitude numeric,
  longitude numeric,
  area_sqm numeric,
  bedrooms int,
  bathrooms int,
  floor int,
  year_built int,
  condition text DEFAULT 'good',
  furnished text DEFAULT 'fully',
  asking_price numeric NOT NULL,
  currency text DEFAULT 'THB',
  price_per_sqm numeric,
  original_purchase_price numeric,
  price_negotiable boolean DEFAULT true,
  is_assignment boolean DEFAULT false,
  assignment_premium numeric,
  remaining_payments jsonb,
  transfer_fee_paid_by text,
  current_rental_income numeric,
  estimated_roi numeric,
  title_type text DEFAULT 'leasehold',
  lease_years_remaining int,
  encumbrances text,
  description text,
  description_ru text,
  media jsonb DEFAULT '[]',
  cover_image text,
  featured boolean DEFAULT false,
  status text DEFAULT 'active',
  views_count int DEFAULT 0,
  inquiries_count int DEFAULT 0,
  days_on_market int DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add resale/development project FK columns to consultation_requests
ALTER TABLE public.consultation_requests
  ADD COLUMN IF NOT EXISTS development_project_id uuid REFERENCES public.property_projects(id),
  ADD COLUMN IF NOT EXISTS resale_property_id uuid REFERENCES public.resale_properties(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dev_units_development ON public.development_units(development_id);
CREATE INDEX IF NOT EXISTS idx_dev_units_type ON public.development_units(unit_type);
CREATE INDEX IF NOT EXISTS idx_resale_zone ON public.resale_properties(zone);
CREATE INDEX IF NOT EXISTS idx_resale_status ON public.resale_properties(status);
CREATE INDEX IF NOT EXISTS idx_resale_type ON public.resale_properties(property_type);
CREATE INDEX IF NOT EXISTS idx_resale_price ON public.resale_properties(asking_price);
CREATE INDEX IF NOT EXISTS idx_resale_assignment ON public.resale_properties(is_assignment) WHERE is_assignment = true;
CREATE INDEX IF NOT EXISTS idx_resale_featured ON public.resale_properties(featured) WHERE featured = true;

-- RLS for development_units
ALTER TABLE public.development_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view development units" ON public.development_units FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage development units" ON public.development_units FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS for resale_properties
ALTER TABLE public.resale_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active resale properties" ON public.resale_properties FOR SELECT USING (status = 'active');
CREATE POLICY "Authenticated users can manage resale properties" ON public.resale_properties FOR ALL TO authenticated USING (true) WITH CHECK (true);
