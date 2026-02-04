-- =============================================
-- PHASE 1: Developers table + property_projects extension
-- =============================================

-- 1. Create developers table
CREATE TABLE public.developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  cover_image TEXT,
  description_en TEXT,
  description_ru TEXT,
  founded_year INTEGER,
  projects_completed INTEGER DEFAULT 0,
  total_units_sold INTEGER DEFAULT 0,
  average_rating NUMERIC(2,1) DEFAULT 0,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  muuno_score INTEGER CHECK (muuno_score BETWEEN 0 AND 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on developers
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies for developers (public read)
CREATE POLICY "Developers are viewable by everyone"
  ON public.developers FOR SELECT
  USING (is_active = true);

-- Admin policy using user_roles table with only valid enum values
CREATE POLICY "Admins can manage developers"
  ON public.developers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- 4. Migrate existing developers from property_projects
INSERT INTO public.developers (name_en, name_ru, slug, is_verified, muuno_score)
SELECT DISTINCT 
  developer_name,
  developer_name,
  lower(regexp_replace(developer_name, '[^a-zA-Z0-9]+', '-', 'g')),
  true,
  CASE 
    WHEN developer_name LIKE '%Premier%' THEN 85
    WHEN developer_name LIKE '%Laguna%' THEN 92
    WHEN developer_name LIKE '%Andaman%' THEN 88
    WHEN developer_name LIKE '%Southern%' THEN 78
    WHEN developer_name LIKE '%Tropical%' THEN 82
    ELSE 75
  END
FROM public.property_projects 
WHERE developer_name IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- 5. Add new columns to property_projects
ALTER TABLE public.property_projects 
ADD COLUMN IF NOT EXISTS developer_id UUID REFERENCES public.developers(id),
ADD COLUMN IF NOT EXISTS project_status TEXT DEFAULT 'offplan' 
  CHECK (project_status IN ('offplan', 'under_construction', 'completed')),
ADD COLUMN IF NOT EXISTS completion_date DATE,
ADD COLUMN IF NOT EXISTS construction_progress INTEGER DEFAULT 0 
  CHECK (construction_progress BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS price_from NUMERIC,
ADD COLUMN IF NOT EXISTS price_to NUMERIC,
ADD COLUMN IF NOT EXISTS units_available INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS units_sold INTEGER DEFAULT 0;

-- 6. Link existing projects to developers
UPDATE public.property_projects pp
SET developer_id = d.id
FROM public.developers d
WHERE pp.developer_name = d.name_en
AND pp.developer_id IS NULL;

-- 7. Set sample data for existing projects
UPDATE public.property_projects
SET 
  project_status = CASE 
    WHEN name_en LIKE '%Residence%' THEN 'offplan'
    WHEN name_en LIKE '%Park%' THEN 'under_construction'
    ELSE 'completed'
  END,
  construction_progress = CASE 
    WHEN name_en LIKE '%Residence%' THEN 35
    WHEN name_en LIKE '%Park%' THEN 65
    ELSE 100
  END,
  completion_date = CASE 
    WHEN name_en LIKE '%Residence%' THEN '2025-06-30'::DATE
    WHEN name_en LIKE '%Park%' THEN '2025-03-31'::DATE
    ELSE '2024-01-01'::DATE
  END,
  price_from = COALESCE(min_investment, 4500000),
  units_available = floor(random() * 20 + 5)::INTEGER,
  units_sold = floor(random() * 30 + 10)::INTEGER
WHERE project_status IS NULL OR construction_progress = 0;

-- 8. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_projects_developer_id 
  ON public.property_projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_property_projects_project_status 
  ON public.property_projects(project_status);
CREATE INDEX IF NOT EXISTS idx_developers_slug 
  ON public.developers(slug);

-- 9. Updated_at trigger for developers
CREATE TRIGGER update_developers_updated_at
  BEFORE UPDATE ON public.developers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();