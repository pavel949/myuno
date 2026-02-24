-- Add complex_id FK to properties table
ALTER TABLE public.properties
ADD COLUMN complex_id UUID REFERENCES public.property_complexes(id) ON DELETE SET NULL;

-- Index for filtering by complex
CREATE INDEX idx_properties_complex_id ON public.properties(complex_id) WHERE complex_id IS NOT NULL;