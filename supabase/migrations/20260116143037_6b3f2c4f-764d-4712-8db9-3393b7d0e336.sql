-- Add unit-specific fields to owner_properties for project integration
ALTER TABLE public.owner_properties
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES property_projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS floor integer,
ADD COLUMN IF NOT EXISTS unit_number text,
ADD COLUMN IF NOT EXISTS view_type text,
ADD COLUMN IF NOT EXISTS furnishing_level text,
ADD COLUMN IF NOT EXISTS equipment text[],
ADD COLUMN IF NOT EXISTS lat numeric,
ADD COLUMN IF NOT EXISTS lng numeric;

-- Create index for project lookup
CREATE INDEX IF NOT EXISTS idx_owner_properties_project_id ON public.owner_properties(project_id);

-- Add comments
COMMENT ON COLUMN public.owner_properties.project_id IS 'Reference to property project/complex';
COMMENT ON COLUMN public.owner_properties.floor IS 'Floor number of the unit';
COMMENT ON COLUMN public.owner_properties.unit_number IS 'Unit/apartment number within the project';
COMMENT ON COLUMN public.owner_properties.view_type IS 'Type of view (sea, pool, garden, etc.)';
COMMENT ON COLUMN public.owner_properties.furnishing_level IS 'Furnishing level (unfurnished, partially, fully, luxury)';
COMMENT ON COLUMN public.owner_properties.equipment IS 'List of equipment/appliances included';
COMMENT ON COLUMN public.owner_properties.lat IS 'Latitude coordinate';
COMMENT ON COLUMN public.owner_properties.lng IS 'Longitude coordinate';