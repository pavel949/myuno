-- Add test restaurant data
INSERT INTO public.restaurants (name_en, name_ru, cuisine, description_en, description_ru, address, district, phone, rating, review_count, price_range, cover_image, delivery_available, delivery_fee, delivery_time, min_order_amount, is_active, is_featured, is_verified, lat, lng, features) VALUES
('Ocean Breeze', 'Океанский бриз', 'seafood', 'Fresh seafood with stunning ocean views', 'Свежие морепродукты с потрясающим видом на океан', '123 Beach Road, Patong', 'Patong', '+66 76 123456', 4.8, 234, 3, 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800', true, 50, '30-45', 300, true, true, true, 7.8951, 98.2950, ARRAY['outdoor_seating', 'sea_view', 'parking']),
('Thai Spice Garden', 'Тайский сад специй', 'thai', 'Authentic Thai cuisine in a garden setting', 'Аутентичная тайская кухня в садовой обстановке', '45 Garden Lane, Kata', 'Kata', '+66 76 234567', 4.6, 189, 2, 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800', true, 40, '25-35', 200, true, false, true, 7.8204, 98.2988, ARRAY['vegetarian_options', 'live_music', 'private_rooms']),
('Sakura Sushi', 'Сакура Суши', 'japanese', 'Premium Japanese sushi and sashimi', 'Премиальные японские суши и сашими', '78 Central Ave, Phuket Town', 'Phuket Town', '+66 76 345678', 4.9, 312, 4, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800', true, 60, '35-50', 500, true, true, true, 7.8814, 98.3923, ARRAY['sushi_bar', 'sake_selection', 'omakase']),
('La Dolce Vita', 'Дольче Вита', 'italian', 'Authentic Italian pizzeria and trattoria', 'Аутентичная итальянская пиццерия и траттория', '22 Wine Street, Kamala', 'Kamala', '+66 76 456789', 4.5, 156, 2, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', true, 45, '30-40', 250, true, false, true, 7.9536, 98.2803, ARRAY['pizza_oven', 'wine_selection', 'delivery']),
('The Curry House', 'Дом Карри', 'indian', 'North and South Indian delicacies', 'Деликатесы Северной и Южной Индии', '56 Spice Road, Chalong', 'Chalong', '+66 76 567890', 4.4, 98, 2, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800', true, 35, '20-30', 150, true, false, true, 7.8439, 98.3378, ARRAY['halal', 'vegetarian_options', 'spicy_levels']),
('Blue Elephant', 'Голубой слон', 'thai', 'Fine dining Thai cuisine', 'Изысканная тайская кухня', '1 Elephant Way, Rawai', 'Rawai', '+66 76 678901', 4.7, 267, 4, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', false, null, null, null, true, true, true, 7.7819, 98.3280, ARRAY['fine_dining', 'romantic', 'reservations_required']);

-- Add menu categories for first restaurant
INSERT INTO public.restaurant_menu_categories (restaurant_id, name_en, name_ru, sort_order) 
SELECT id, 'Appetizers', 'Закуски', 1 FROM restaurants WHERE name_en = 'Ocean Breeze'
UNION ALL
SELECT id, 'Main Courses', 'Основные блюда', 2 FROM restaurants WHERE name_en = 'Ocean Breeze'
UNION ALL
SELECT id, 'Desserts', 'Десерты', 3 FROM restaurants WHERE name_en = 'Ocean Breeze';

-- Add menu categories for Thai Spice Garden
INSERT INTO public.restaurant_menu_categories (restaurant_id, name_en, name_ru, sort_order) 
SELECT id, 'Salads', 'Салаты', 1 FROM restaurants WHERE name_en = 'Thai Spice Garden'
UNION ALL
SELECT id, 'Curries', 'Карри', 2 FROM restaurants WHERE name_en = 'Thai Spice Garden'
UNION ALL
SELECT id, 'Noodles & Rice', 'Лапша и рис', 3 FROM restaurants WHERE name_en = 'Thai Spice Garden';

-- Add menu items for Ocean Breeze
INSERT INTO public.restaurant_menu_items (restaurant_id, category_id, name_en, name_ru, description_en, description_ru, price, image, is_popular)
SELECT r.id, c.id, 'Grilled Tiger Prawns', 'Тигровые креветки на гриле', 'Fresh prawns with garlic butter sauce', 'Свежие креветки с чесночным маслом', 450, 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400', true
FROM restaurants r, restaurant_menu_categories c
WHERE r.name_en = 'Ocean Breeze' AND c.name_en = 'Appetizers' AND c.restaurant_id = r.id;

INSERT INTO public.restaurant_menu_items (restaurant_id, category_id, name_en, name_ru, description_en, description_ru, price, image, is_popular)
SELECT r.id, c.id, 'Seafood Platter', 'Блюдо из морепродуктов', 'Mixed seafood selection for two', 'Ассорти морепродуктов на двоих', 1200, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', true
FROM restaurants r, restaurant_menu_categories c
WHERE r.name_en = 'Ocean Breeze' AND c.name_en = 'Main Courses' AND c.restaurant_id = r.id;

INSERT INTO public.restaurant_menu_items (restaurant_id, category_id, name_en, name_ru, description_en, description_ru, price, image, is_popular)
SELECT r.id, c.id, 'Grilled Sea Bass', 'Сибас на гриле', 'Whole sea bass with herbs and lemon', 'Целый сибас с травами и лимоном', 650, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400', false
FROM restaurants r, restaurant_menu_categories c
WHERE r.name_en = 'Ocean Breeze' AND c.name_en = 'Main Courses' AND c.restaurant_id = r.id;

INSERT INTO public.restaurant_menu_items (restaurant_id, category_id, name_en, name_ru, description_en, description_ru, price, image, is_popular)
SELECT r.id, c.id, 'Mango Sticky Rice', 'Манго с клейким рисом', 'Traditional Thai dessert with coconut milk', 'Традиционный тайский десерт с кокосовым молоком', 150, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', true
FROM restaurants r, restaurant_menu_categories c
WHERE r.name_en = 'Ocean Breeze' AND c.name_en = 'Desserts' AND c.restaurant_id = r.id;

-- Add menu items for Thai Spice Garden
INSERT INTO public.restaurant_menu_items (restaurant_id, category_id, name_en, name_ru, description_en, description_ru, price, image, is_popular, is_spicy)
SELECT r.id, c.id, 'Som Tam', 'Сом Там', 'Spicy green papaya salad', 'Острый салат из зелёной папайи', 120, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', true, true
FROM restaurants r, restaurant_menu_categories c
WHERE r.name_en = 'Thai Spice Garden' AND c.name_en = 'Salads' AND c.restaurant_id = r.id;

INSERT INTO public.restaurant_menu_items (restaurant_id, category_id, name_en, name_ru, description_en, description_ru, price, image, is_popular, is_spicy)
SELECT r.id, c.id, 'Green Curry', 'Зелёное карри', 'Creamy coconut green curry with chicken', 'Кремовое кокосовое карри с курицей', 180, 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400', true, true
FROM restaurants r, restaurant_menu_categories c
WHERE r.name_en = 'Thai Spice Garden' AND c.name_en = 'Curries' AND c.restaurant_id = r.id;

INSERT INTO public.restaurant_menu_items (restaurant_id, category_id, name_en, name_ru, description_en, description_ru, price, image, is_popular)
SELECT r.id, c.id, 'Pad Thai', 'Пад Тай', 'Classic stir-fried rice noodles', 'Классическая жареная рисовая лапша', 150, 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400', true
FROM restaurants r, restaurant_menu_categories c
WHERE r.name_en = 'Thai Spice Garden' AND c.name_en = 'Noodles & Rice' AND c.restaurant_id = r.id;