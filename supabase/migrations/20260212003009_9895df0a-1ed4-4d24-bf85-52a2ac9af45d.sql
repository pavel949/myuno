
-- Add psychology, margin, and SEO columns to bouquets table
ALTER TABLE public.bouquets
  ADD COLUMN IF NOT EXISTS cost_thb numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS margin_percent numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS box_type text DEFAULT 'wrap',
  ADD COLUMN IF NOT EXISTS short_description_en text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS short_description_ru text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS urgency_badge text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_proof_badge text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS scarcity_level text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS emotional_trigger_tag text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bestseller_rank integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS seo_slug text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS collection_slug text DEFAULT NULL;

-- Add flower_addons table for upsell items
CREATE TABLE IF NOT EXISTS public.flower_addons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en text NOT NULL,
  name_ru text NOT NULL,
  price_thb numeric NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'addon',
  image_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flower_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Flower addons are publicly readable"
  ON public.flower_addons FOR SELECT USING (true);

-- Insert standard addons
INSERT INTO public.flower_addons (name_en, name_ru, price_thb, type, sort_order) VALUES
  ('Greeting Card', 'Открытка', 150, 'card', 1),
  ('Premium Chocolate Box', 'Премиум шоколад', 890, 'chocolate', 2),
  ('Glass Vase', 'Стеклянная ваза', 590, 'vase', 3),
  ('Teddy Bear', 'Плюшевый мишка', 690, 'toy', 4),
  ('Balloon Bundle', 'Воздушные шары', 450, 'balloon', 5);
