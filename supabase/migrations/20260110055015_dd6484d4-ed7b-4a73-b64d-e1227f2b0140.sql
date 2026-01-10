-- Insert home services subcategories
INSERT INTO public.categories (id, slug, name_en, name_ru, icon, is_active, sort_order, mini_app_type)
VALUES 
  (gen_random_uuid(), 'cleaning', 'Cleaning', 'Уборка', 'Sparkles', true, 20, 'services'),
  (gen_random_uuid(), 'laundry', 'Laundry', 'Прачечная', 'Shirt', true, 21, 'services'),
  (gen_random_uuid(), 'plumbing', 'Plumbing', 'Сантехника', 'Wrench', true, 22, 'services'),
  (gen_random_uuid(), 'electrical', 'Electrical', 'Электрика', 'Zap', true, 23, 'services'),
  (gen_random_uuid(), 'ac-repair', 'AC Repair', 'Ремонт кондиционеров', 'Wind', true, 24, 'services'),
  (gen_random_uuid(), 'gardening', 'Gardening', 'Садоводство', 'Flower2', true, 25, 'services'),
  (gen_random_uuid(), 'pest-control', 'Pest Control', 'Дезинсекция', 'Bug', true, 26, 'services'),
  (gen_random_uuid(), 'handyman', 'Handyman', 'Мастер на час', 'Hammer', true, 27, 'services')
ON CONFLICT (slug) DO NOTHING;