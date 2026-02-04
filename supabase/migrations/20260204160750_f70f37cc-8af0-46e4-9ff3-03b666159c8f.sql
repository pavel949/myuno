-- Add flash deals and purchase tracking fields to marketplace_products
ALTER TABLE marketplace_products 
ADD COLUMN IF NOT EXISTS is_flash_deal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flash_deal_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 0;

-- Create promotions table for dynamic promo banners
CREATE TABLE IF NOT EXISTS marketplace_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  subtitle_en TEXT,
  subtitle_ru TEXT,
  badge_en TEXT,
  badge_ru TEXT,
  image_url TEXT,
  gradient TEXT DEFAULT 'from-primary/80 to-primary/60',
  icon TEXT DEFAULT 'Truck',
  link_path TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketplace_promotions ENABLE ROW LEVEL SECURITY;

-- Public read policy for promotions
CREATE POLICY "Promotions are publicly readable"
ON marketplace_promotions
FOR SELECT
USING (is_active = true);

-- Insert default promotional banners
INSERT INTO marketplace_promotions (title_en, title_ru, subtitle_en, subtitle_ru, badge_en, badge_ru, gradient, icon, link_path, sort_order)
VALUES 
  ('Free Delivery', 'Бесплатная доставка', 'On orders over ฿1,500', 'При заказе от ฿1,500', 'Limited Time', 'Ограничено', 'from-emerald-500 via-emerald-600 to-teal-600', 'Truck', '/market/category/deals', 1),
  ('Flash Deals', 'Молниеносные скидки', 'Up to 50% off selected items', 'Скидки до 50% на избранные товары', 'Hot', 'Горячо', 'from-orange-500 via-red-500 to-pink-500', 'Zap', '/market/category/deals', 2),
  ('Quality Guaranteed', 'Гарантия качества', 'Fresh products from verified vendors', 'Свежие продукты от проверенных продавцов', 'Trust', 'Доверие', 'from-blue-500 via-indigo-500 to-purple-500', 'Shield', '/market/vendors', 3);

-- Mark some products as flash deals for demo (using subquery for LIMIT)
UPDATE marketplace_products 
SET is_flash_deal = true, 
    flash_deal_ends_at = NOW() + INTERVAL '1 day'
WHERE id IN (
  SELECT id FROM marketplace_products 
  WHERE original_price IS NOT NULL 
    AND original_price > price 
    AND in_stock = true
  ORDER BY sort_order
  LIMIT 10
);