
-- Create restaurant_hours table for normalized hours
CREATE TABLE IF NOT EXISTS public.restaurant_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time time NOT NULL,
  close_time time NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, day_of_week, open_time)
);

-- Create restaurant_menus table
CREATE TABLE IF NOT EXISTS public.restaurant_menus (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title text NOT NULL,
  menu_type text NOT NULL DEFAULT 'a_la_carte' CHECK (menu_type IN ('a_la_carte','tasting','drinks','wine','dessert','seasonal','beverages','vegetarian','cocktails','set_menu','other')),
  file_url text,
  external_url text,
  currency text DEFAULT 'THB',
  is_active boolean DEFAULT true,
  source_url text,
  scraped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create data_provenance table
CREATE TABLE IF NOT EXISTS public.data_provenance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  field_name text NOT NULL,
  field_value text,
  source_url text NOT NULL,
  source_type text CHECK (source_type IN ('chope','tablecheck','official','sevenrooms','manual')),
  scraped_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create data_quality_issues table
CREATE TABLE IF NOT EXISTS public.data_quality_issues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  issue_code text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('P0','P1','P2')),
  message text NOT NULL,
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

-- Add columns to restaurants
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS price_band text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS description_short text;

-- Enable RLS
ALTER TABLE public.restaurant_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_quality_issues ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can read restaurant hours" ON public.restaurant_hours FOR SELECT USING (true);
CREATE POLICY "Public can read restaurant menus" ON public.restaurant_menus FOR SELECT USING (is_active = true);

-- Admin write policies using has_role RPC pattern
CREATE POLICY "Admin can manage restaurant hours" ON public.restaurant_hours FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','staff','uno_team'))
);
CREATE POLICY "Admin can manage restaurant menus" ON public.restaurant_menus FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','staff','uno_team'))
);
CREATE POLICY "Admin can manage data provenance" ON public.data_provenance FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','staff','uno_team'))
);
CREATE POLICY "Admin can manage quality issues" ON public.data_quality_issues FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','staff','uno_team'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_hours_restaurant_id ON public.restaurant_hours(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_menus_restaurant_id ON public.restaurant_menus(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_data_provenance_entity ON public.data_provenance(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_entity ON public.data_quality_issues(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_restaurants_city_active ON public.restaurants(city, is_active);
