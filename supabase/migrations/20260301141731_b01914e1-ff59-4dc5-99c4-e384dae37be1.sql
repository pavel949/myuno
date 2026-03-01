ALTER TABLE public.location_knowledge 
ADD CONSTRAINT location_knowledge_city_section_slug_unique 
UNIQUE (city_id, section, slug);