-- Create location_knowledge table for the Knowledge Hub
CREATE TABLE public.location_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  section TEXT NOT NULL, -- overview, culture, dos-donts, government, nature, practical, emergency
  slug TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  content_en TEXT, -- Markdown content
  content_ru TEXT, -- Markdown content
  summary_en TEXT, -- Short description for cards
  summary_ru TEXT,
  icon TEXT, -- Lucide icon name or emoji
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint for city + section + slug combination
  UNIQUE(city_id, section, slug)
);

-- Create index for efficient queries
CREATE INDEX idx_location_knowledge_city_section ON public.location_knowledge(city_id, section);
CREATE INDEX idx_location_knowledge_published ON public.location_knowledge(is_published) WHERE is_published = true;

-- Enable Row Level Security
ALTER TABLE public.location_knowledge ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read access for published content
CREATE POLICY "Anyone can view published knowledge content" 
ON public.location_knowledge 
FOR SELECT 
USING (is_published = true);

-- Admin can manage all content (using user_roles)
CREATE POLICY "Admins can manage knowledge content" 
ON public.location_knowledge 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'uno_team', 'staff')
  )
);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_location_knowledge_updated_at
BEFORE UPDATE ON public.location_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.location_knowledge IS 'Stores localized knowledge content for each city location';