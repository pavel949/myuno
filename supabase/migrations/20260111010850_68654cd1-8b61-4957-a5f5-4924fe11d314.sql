-- SEED DATA with proper UUIDs
INSERT INTO public.providers (id, name, description_en, description_ru, business_category, is_verified, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Phuket Luxury Yachts', 'Premium yacht charters', 'Аренда яхт', 'water', true, true),
  ('22222222-2222-2222-2222-222222222222', 'Bloom Flowers', 'Fresh flowers delivery', 'Доставка цветов', 'flowers', true, true),
  ('33333333-3333-3333-3333-333333333333', 'Phuket Market', 'Local products', 'Местные товары', 'services', true, true)
ON CONFLICT (id) DO NOTHING;

-- Yachts with proper UUIDs
INSERT INTO public.yachts (provider_id, name_en, name_ru, yacht_type, cover_image, price_full_day, price_half_day, capacity, length_meters, year_built, cabins, bathrooms, features_en, features_ru, has_crew, location_name, location_ru, rating, review_count, is_active, is_featured, approval_status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Luxury Ocean Dream', 'Люкс Океан Дрим', 'yacht', 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800', 45000, 28000, 12, 24, 2021, 4, 3, ARRAY['Captain included', 'Catering', 'Snorkeling'], ARRAY['Капитан включён', 'Кейтеринг', 'Снорклинг'], true, 'Chalong Bay', 'Чалонг', 4.9, 45, true, true, 'approved'),
  ('11111111-1111-1111-1111-111111111111', 'Sunset Catamaran', 'Катамаран Сансет', 'catamaran', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 35000, 20000, 20, 18, 2019, 3, 2, ARRAY['BBQ', 'Fishing gear'], ARRAY['BBQ', 'Рыболовные снасти'], true, 'Patong', 'Патонг', 4.8, 78, true, false, 'approved'),
  ('11111111-1111-1111-1111-111111111111', 'Speed Runner', 'Спид Раннер', 'speedboat', 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800', 18000, 10000, 8, 12, 2022, 0, 1, ARRAY['Fast transfer', 'Island hopping'], ARRAY['Быстрый трансфер', 'По островам'], true, 'Rawai', 'Равай', 4.7, 123, true, false, 'approved');

-- Flower shops
INSERT INTO public.flower_shops (provider_id, name_en, name_ru, cover_image, address, delivery_fee, min_order_amount, rating, review_count, is_active, approval_status)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'Bloom Flowers Phuket', 'Блум Флауэрс', 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800', 'Patong', 200, 500, 4.8, 156, true, 'approved');

-- Bouquets
INSERT INTO public.bouquets (shop_id, name_en, name_ru, category, image, price, flowers, colors, size, is_popular)
SELECT id, 'Romantic Roses', 'Романтические Розы', 'roses', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600', 2500, ARRAY['red roses'], ARRAY['red'], 'large', true
FROM public.flower_shops WHERE name_en = 'Bloom Flowers Phuket' LIMIT 1;

INSERT INTO public.bouquets (shop_id, name_en, name_ru, category, image, price, flowers, colors, size, is_popular)
SELECT id, 'Spring Meadow', 'Весенний Луг', 'mixed', 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600', 1800, ARRAY['tulips', 'daisies'], ARRAY['pink', 'white'], 'medium', true
FROM public.flower_shops WHERE name_en = 'Bloom Flowers Phuket' LIMIT 1;

-- Stores
INSERT INTO public.stores (provider_id, name_en, name_ru, category, cover_image, address, delivery_fee, min_order_amount, rating, review_count, is_active, approval_status)
VALUES 
  ('33333333-3333-3333-3333-333333333333', 'Phuket Gourmet Market', 'Пхукет Гурме Маркет', 'grocery', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800', 'Phuket Town', 100, 300, 4.7, 234, true, 'approved');

-- Products
INSERT INTO public.store_products (store_id, name_en, name_ru, category, image, price, unit, is_popular)
SELECT id, 'French Wine', 'Французское Вино', 'wine', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400', 1500, 'bottle', true
FROM public.stores WHERE name_en = 'Phuket Gourmet Market' LIMIT 1;