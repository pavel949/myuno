-- Create property_projects table for developments/complexes
CREATE TABLE public.property_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  address TEXT,
  district TEXT,
  lat NUMERIC,
  lng NUMERIC,
  developer_name TEXT,
  year_built INTEGER,
  total_units INTEGER,
  cover_image TEXT,
  images TEXT[],
  video_url TEXT,
  amenities TEXT[],
  infrastructure TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_projects ENABLE ROW LEVEL SECURITY;

-- Public read access for projects
CREATE POLICY "Anyone can view active projects"
  ON public.property_projects
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can create projects
CREATE POLICY "Authenticated users can create projects"
  ON public.property_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update their projects
CREATE POLICY "Authenticated users can update projects"
  ON public.property_projects
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add project_id and unit fields to properties table
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS floor INTEGER,
  ADD COLUMN IF NOT EXISTS unit_number TEXT,
  ADD COLUMN IF NOT EXISTS view_type TEXT,
  ADD COLUMN IF NOT EXISTS furnishing_level TEXT,
  ADD COLUMN IF NOT EXISTS equipment TEXT[];

-- Add foreign key constraint
ALTER TABLE public.properties
  ADD CONSTRAINT fk_properties_project
  FOREIGN KEY (project_id) REFERENCES public.property_projects(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_properties_project_id ON public.properties(project_id);

-- Add to owner_properties
ALTER TABLE public.owner_properties
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS floor INTEGER,
  ADD COLUMN IF NOT EXISTS unit_number TEXT,
  ADD COLUMN IF NOT EXISTS view_type TEXT,
  ADD COLUMN IF NOT EXISTS furnishing_level TEXT,
  ADD COLUMN IF NOT EXISTS equipment TEXT[];

ALTER TABLE public.owner_properties
  ADD CONSTRAINT fk_owner_properties_project
  FOREIGN KEY (project_id) REFERENCES public.property_projects(id);

CREATE INDEX IF NOT EXISTS idx_owner_properties_project_id ON public.owner_properties(project_id);