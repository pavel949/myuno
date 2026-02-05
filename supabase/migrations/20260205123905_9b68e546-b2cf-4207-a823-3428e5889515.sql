-- =============================================
-- LIFE SITUATIONS META-LAYER (ADD-ONLY, NON-DESTRUCTIVE)
-- =============================================

-- 1. Life Situations table - core definitions
CREATE TABLE public.life_situations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  icon TEXT DEFAULT 'Compass',
  color TEXT DEFAULT '#3B82F6',
  priority INT DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Catalog Life Map - entity-to-situation mapping (loose coupling)
CREATE TABLE public.catalog_life_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('property', 'service', 'experience', 'transport', 'restaurant', 'yacht', 'tour')),
  entity_id UUID NOT NULL,
  life_situation_id UUID REFERENCES public.life_situations(id) ON DELETE CASCADE,
  weight INT DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
  rules JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(entity_type, entity_id, life_situation_id)
);

-- 3. Enable RLS on new tables
ALTER TABLE public.life_situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_life_map ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for life_situations (public read, admin write)
CREATE POLICY "Life situations are viewable by everyone"
ON public.life_situations FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage life situations"
ON public.life_situations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 5. RLS Policies for catalog_life_map (public read, admin write)
CREATE POLICY "Catalog mappings are viewable by everyone"
ON public.catalog_life_map FOR SELECT
USING (true);

CREATE POLICY "Admins can manage catalog mappings"
ON public.catalog_life_map FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 6. Indexes for performance
CREATE INDEX idx_life_situations_code ON public.life_situations(code);
CREATE INDEX idx_life_situations_active ON public.life_situations(is_active, priority);
CREATE INDEX idx_catalog_life_map_entity ON public.catalog_life_map(entity_type, entity_id);
CREATE INDEX idx_catalog_life_map_situation ON public.catalog_life_map(life_situation_id);
CREATE INDEX idx_catalog_life_map_weight ON public.catalog_life_map(weight DESC);

-- 7. Updated_at trigger
CREATE TRIGGER update_life_situations_updated_at
  BEFORE UPDATE ON public.life_situations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_catalog_life_map_updated_at
  BEFORE UPDATE ON public.catalog_life_map
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Seed initial life situations
INSERT INTO public.life_situations (code, title_en, title_ru, description_en, description_ru, icon, color, priority) VALUES
  ('arrival_first_day', 'Just Arrived', 'Только приехал', 'First day essentials: transport, SIM, accommodation', 'Всё для первого дня: трансфер, SIM-карта, жильё', 'Plane', '#3B82F6', 10),
  ('long_term_living', 'Long-term Stay', 'Длительное проживание', 'Settling in: rentals, banking, insurance', 'Обустройство: аренда, банки, страховка', 'Home', '#10B981', 20),
  ('family_with_children', 'Family with Kids', 'Семья с детьми', 'Family-friendly services and activities', 'Услуги и развлечения для семьи', 'Users', '#F59E0B', 30),
  ('emergency_medical', 'Medical Help', 'Медицинская помощь', 'Urgent medical care and pharmacies', 'Срочная медицинская помощь и аптеки', 'Heart', '#EF4444', 5),
  ('investment_property', 'Property Investment', 'Инвестиции в недвижимость', 'Buy, invest, or manage property', 'Покупка, инвестиции, управление недвижимостью', 'Building', '#8B5CF6', 40),
  ('vacation_leisure', 'Vacation & Leisure', 'Отдых и развлечения', 'Tours, yachts, restaurants, experiences', 'Туры, яхты, рестораны, впечатления', 'Palmtree', '#06B6D4', 25),
  ('business_work', 'Business & Work', 'Бизнес и работа', 'Coworking, legal, banking for business', 'Коворкинги, юристы, банки для бизнеса', 'Briefcase', '#6366F1', 35),
  ('relocation_visa', 'Relocation & Visa', 'Релокация и визы', 'Visa services, documentation, legalization', 'Визовые услуги, документы, легализация', 'FileText', '#EC4899', 15);

-- 9. Function to resolve catalog by life situation
CREATE OR REPLACE FUNCTION public.resolve_catalog_by_life_situation(
  p_life_code TEXT,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  weight INT,
  rules JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    clm.entity_type,
    clm.entity_id,
    clm.weight,
    clm.rules
  FROM catalog_life_map clm
  JOIN life_situations ls ON ls.id = clm.life_situation_id
  WHERE ls.code = p_life_code
    AND ls.is_active = true
  ORDER BY clm.weight DESC
  LIMIT p_limit;
END;
$$;