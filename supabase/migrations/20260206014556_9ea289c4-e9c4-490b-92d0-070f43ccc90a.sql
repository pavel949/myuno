-- Add rich metadata columns to bouquets for production catalog
ALTER TABLE bouquets 
ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS composition_en TEXT,
ADD COLUMN IF NOT EXISTS composition_ru TEXT,
ADD COLUMN IF NOT EXISTS style TEXT,
ADD COLUMN IF NOT EXISTS occasion_tags TEXT[],
ADD COLUMN IF NOT EXISTS color_palette TEXT,
ADD COLUMN IF NOT EXISTS lifeos_tags TEXT[],
ADD COLUMN IF NOT EXISTS availability_note TEXT,
ADD COLUMN IF NOT EXISTS preparation_time_minutes INTEGER DEFAULT 120;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_bouquets_occasion_tags ON bouquets USING GIN(occasion_tags);
CREATE INDEX IF NOT EXISTS idx_bouquets_style ON bouquets(style);
CREATE INDEX IF NOT EXISTS idx_bouquets_color_palette ON bouquets(color_palette);
CREATE INDEX IF NOT EXISTS idx_bouquets_sku ON bouquets(sku);

-- Create official UNO Flowers shop for production catalog
INSERT INTO flower_shops (
  id,
  name_en,
  name_ru,
  description_en,
  description_ru,
  is_active,
  is_featured,
  is_verified,
  delivery_available,
  delivery_fee,
  min_order_amount,
  rating,
  review_count
) VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'UNO Flowers Phuket',
  'UNO Цветы Пхукет',
  'Premium fresh flower delivery across Phuket. Curated bouquets for every occasion with same-day delivery.',
  'Премиальная доставка свежих цветов по всему Пхукету. Авторские букеты для любого повода с доставкой в тот же день.',
  true,
  true,
  true,
  true,
  150,
  1500,
  4.9,
  127
) ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ru = EXCLUDED.name_ru,
  description_en = EXCLUDED.description_en,
  description_ru = EXCLUDED.description_ru,
  is_featured = EXCLUDED.is_featured,
  is_verified = EXCLUDED.is_verified;