-- =============================================
-- PART 1: Create marketplace_vendors table
-- =============================================

CREATE TABLE public.marketplace_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  logo_url TEXT,
  cover_image TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  address_ru TEXT,
  rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_vendors ENABLE ROW LEVEL SECURITY;

-- Public read access for vendors
CREATE POLICY "Vendors are viewable by everyone" 
ON public.marketplace_vendors 
FOR SELECT 
USING (is_active = true);

-- Create index for slug lookups
CREATE INDEX idx_marketplace_vendors_slug ON public.marketplace_vendors(slug);
CREATE INDEX idx_marketplace_vendors_active ON public.marketplace_vendors(is_active);

-- Add updated_at trigger
CREATE TRIGGER update_marketplace_vendors_updated_at
BEFORE UPDATE ON public.marketplace_vendors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PART 2: Add vendor_id to marketplace_products
-- =============================================

ALTER TABLE public.marketplace_products 
ADD COLUMN vendor_id UUID REFERENCES public.marketplace_vendors(id);

-- Create index for vendor lookups
CREATE INDEX idx_marketplace_products_vendor ON public.marketplace_products(vendor_id);

-- =============================================
-- PART 3: Seed vendor data
-- =============================================

INSERT INTO public.marketplace_vendors (slug, name_en, name_ru, description_en, description_ru, rating, review_count, verified) VALUES
('thai-rice-co', 'Thai Rice Co.', 'Тай Райс Ко.', 'Premium Thai rice supplier with over 20 years of experience', 'Поставщик премиального тайского риса с более чем 20-летним опытом', 4.8, 156, true),
('organic-farm', 'Organic Farm', 'Органик Фарм', 'Certified organic produce from local farms', 'Сертифицированная органическая продукция с местных ферм', 4.6, 89, true),
('coca-cola', 'Coca-Cola', 'Кока-Кола', 'World''s leading beverage company', 'Ведущая мировая компания по производству напитков', 4.9, 1250, true),
('red-bull', 'Red Bull', 'Ред Булл', 'Energy drink manufacturer', 'Производитель энергетических напитков', 4.7, 890, true),
('pepsi', 'PepsiCo', 'ПепсиКо', 'Global food and beverage company', 'Глобальная продовольственная компания', 4.8, 1100, true),
('nestle', 'Nestlé', 'Нестле', 'World''s largest food company', 'Крупнейшая продовольственная компания мира', 4.7, 2340, true),
('unilever', 'Unilever', 'Юнилевер', 'Consumer goods multinational', 'Международная компания потребительских товаров', 4.5, 1890, true),
('local-bakery', 'Local Bakery', 'Местная Пекарня', 'Fresh artisan bread and pastries daily', 'Свежий ремесленный хлеб и выпечка каждый день', 4.9, 234, true),
('asian-foods', 'Asian Foods Import', 'Азиатские Продукты', 'Authentic Asian ingredients and snacks', 'Аутентичные азиатские ингредиенты и закуски', 4.4, 178, true),
('dairy-fresh', 'Dairy Fresh', 'Дейри Фреш', 'Premium dairy products from happy cows', 'Премиальные молочные продукты от счастливых коров', 4.6, 567, true),
('meat-masters', 'Meat Masters', 'Мит Мастерс', 'Quality meats and poultry', 'Качественное мясо и птица', 4.5, 445, true),
('seafood-direct', 'Seafood Direct', 'Морепродукты Директ', 'Fresh seafood delivered daily', 'Свежие морепродукты с ежедневной доставкой', 4.7, 312, true),
('green-valley', 'Green Valley', 'Грин Вэлли', 'Fresh vegetables and fruits', 'Свежие овощи и фрукты', 4.8, 678, true),
('snack-world', 'Snack World', 'Снэк Ворлд', 'International snacks and treats', 'Международные закуски и сладости', 4.3, 445, false),
('beverage-plus', 'Beverage Plus', 'Бевериджи Плюс', 'Wide selection of drinks', 'Широкий выбор напитков', 4.4, 234, false),
('frozen-goods', 'Frozen Goods Co', 'Фрозен Гудс', 'Quality frozen products', 'Качественные замороженные продукты', 4.2, 189, false),
('health-foods', 'Health Foods', 'Хелс Фудс', 'Healthy and organic options', 'Здоровые и органические продукты', 4.6, 345, true),
('thai-spices', 'Thai Spices', 'Тайские Специи', 'Authentic Thai spices and sauces', 'Аутентичные тайские специи и соусы', 4.7, 267, true),
('european-deli', 'European Deli', 'Европейский Деликатесы', 'Premium European foods', 'Премиальные европейские продукты', 4.5, 189, true),
('russian-foods', 'Russian Foods', 'Русские Продукты', 'Traditional Russian groceries', 'Традиционные русские продукты', 4.8, 567, true);

-- =============================================
-- PART 4: Link existing products to vendors
-- =============================================

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'thai-rice-co'
) WHERE vendor_name ILIKE '%Thai Rice%' OR vendor_name ILIKE '%rice%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'organic-farm'
) WHERE vendor_name ILIKE '%Organic%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'coca-cola'
) WHERE vendor_name ILIKE '%Coca%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'red-bull'
) WHERE vendor_name ILIKE '%Red Bull%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'pepsi'
) WHERE vendor_name ILIKE '%Pepsi%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'nestle'
) WHERE vendor_name ILIKE '%Nestl%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'local-bakery'
) WHERE vendor_name ILIKE '%Bakery%' OR vendor_name ILIKE '%Baker%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'asian-foods'
) WHERE vendor_name ILIKE '%Asian%' OR vendor_name ILIKE '%Thai%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'dairy-fresh'
) WHERE vendor_name ILIKE '%Dairy%' OR vendor_name ILIKE '%Milk%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'meat-masters'
) WHERE vendor_name ILIKE '%Meat%' OR vendor_name ILIKE '%Butcher%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'seafood-direct'
) WHERE vendor_name ILIKE '%Seafood%' OR vendor_name ILIKE '%Fish%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'green-valley'
) WHERE vendor_name ILIKE '%Green%' OR vendor_name ILIKE '%Farm%' OR vendor_name ILIKE '%Fresh%';

-- Assign remaining products without vendor to a default vendor
UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'asian-foods'
) WHERE vendor_id IS NULL;