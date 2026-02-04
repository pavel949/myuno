-- Create service_promotions table for promo banners
CREATE TABLE service_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  subtitle_en TEXT,
  subtitle_ru TEXT,
  image_url TEXT NOT NULL,
  gradient TEXT DEFAULT 'from-amber-500/80 to-orange-500/60',
  link_path TEXT NOT NULL,
  category_slug TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE service_promotions ENABLE ROW LEVEL SECURITY;

-- Public read access (promotions are public)
CREATE POLICY "Public read access" ON service_promotions 
  FOR SELECT USING (true);

-- Insert sample promotions for services
INSERT INTO service_promotions (title_en, title_ru, subtitle_en, subtitle_ru, image_url, link_path, gradient, sort_order) VALUES
('Deep Cleaning -30%', 'Генуборка -30%', 'Professional home cleaning', 'Профессиональная уборка', 
 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800', '/cleaning', 'from-emerald-500/80 to-teal-500/60', 1),
('AC Service ฿500', 'Сервис кондиционеров ฿500', 'Beat the heat this summer', 'Подготовка к жаркому сезону', 
 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800', '/services?category=ac-repair', 'from-blue-500/80 to-cyan-500/60', 2),
('Pool Care from ฿800', 'Бассейн от ฿800/нед', 'Weekly pool maintenance', 'Еженедельное обслуживание', 
 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800', '/services?category=pool', 'from-sky-500/80 to-blue-500/60', 3),
('Plumbing 24/7', 'Сантехник 24/7', 'Emergency repairs anytime', 'Срочный ремонт в любое время', 
 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800', '/services?category=plumbing', 'from-orange-500/80 to-amber-500/60', 4);