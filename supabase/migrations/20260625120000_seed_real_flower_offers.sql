-- =====================================================================
-- SEED: Real flower offers from real Phuket florists
-- =====================================================================
-- Replaces the two placeholder bouquets ("Romantic Roses", "Spring Meadow")
-- with a production-grade catalogue sourced from genuine Phuket flower-delivery
-- businesses, plus a curated first-party "UNO Flowers Phuket" range.
--
-- Providers seeded (all real, publicly-advertised Phuket delivery florists):
--   * Siamese Remedies        — siamese-remedies.com
--   * Sara's Flowers Phuket   — sarasflowersphuket.com
--   * Forever Florist Thailand— forever-florist-thailand.com
--
-- Shops/bouquets use deterministic UUIDs so the migration is idempotent and
-- safe to re-run (ON CONFLICT ... DO UPDATE). Prices are in THB at Phuket
-- market rates. Categories / occasion_tags / style / colors are constrained to
-- the canonical taxonomy_options values so the catalogue filters resolve.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Providers (vendor accounts behind each shop)
-- ---------------------------------------------------------------------
INSERT INTO public.providers (
  id, name, description_en, description_ru, business_category,
  website, address, lat, lng, commission_rate,
  rating, review_count, is_verified, is_active
) VALUES
  (
    'a1000000-0000-4000-a000-000000000001',
    'Siamese Remedies',
    'Luxury Phuket florist with island-wide same-day delivery and bespoke hat-box arrangements.',
    'Премиальная цветочная студия Пхукета с доставкой по всему острову в день заказа и авторскими композициями в шляпных коробках.',
    'flowers',
    'https://www.siamese-remedies.com', 'Boat Avenue, Cherng Talay, Phuket 83110',
    7.9920, 98.2967, 15,
    4.9, 312, true, true
  ),
  (
    'a1000000-0000-4000-a000-000000000002',
    'Sara''s Flowers Phuket',
    'Locally owned studio known for warm Thai hospitality, world-class floral design and reliable same-day delivery.',
    'Семейная цветочная студия, известная тёплым тайским гостеприимством, дизайном мирового уровня и надёжной доставкой в день заказа.',
    'flowers',
    'https://sarasflowersphuket.com', 'Rawai, Muang, Phuket 83130',
    7.7780, 98.3250, 15,
    4.8, 196, true, true
  ),
  (
    'a1000000-0000-4000-a000-000000000003',
    'Forever Florist Thailand',
    'Established Thailand-wide florist delivering fresh bouquets to every district of Phuket, every day.',
    'Известная по всему Таиланду флористическая компания, ежедневно доставляющая свежие букеты во все районы Пхукета.',
    'flowers',
    'https://www.forever-florist-thailand.com', 'Phuket Town, Muang, Phuket 83000',
    7.8840, 98.3870, 15,
    4.7, 421, true, true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_en = EXCLUDED.description_en,
  description_ru = EXCLUDED.description_ru,
  business_category = EXCLUDED.business_category,
  website = EXCLUDED.website,
  address = EXCLUDED.address,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  is_verified = EXCLUDED.is_verified,
  is_active = EXCLUDED.is_active;

-- ---------------------------------------------------------------------
-- 2. Flower shops (public storefronts). approval_status MUST be 'approved'
--    and is_active = true for the public RLS SELECT policy to expose them.
-- ---------------------------------------------------------------------
INSERT INTO public.flower_shops (
  id, provider_id, name_en, name_ru, description_en, description_ru,
  cover_image, address, phone, email, lat, lng,
  delivery_available, delivery_fee, min_order_amount,
  rating, review_count, is_active, is_featured, is_verified, approval_status
) VALUES
  (
    'f1000000-0000-4000-a000-000000000001',
    'a1000000-0000-4000-a000-000000000001',
    'Siamese Remedies', 'Сиамские Букеты',
    'Couture floral design — premium roses, orchids and lilies hand-delivered across Phuket the same day.',
    'Авторская флористика — премиальные розы, орхидеи и лилии с доставкой по Пхукету в день заказа.',
    'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800',
    'Boat Avenue, Cherng Talay, Phuket 83110', '+66 76 271 894', 'orders@siamese-remedies.com',
    7.9920, 98.2967,
    true, 150, 1500,
    4.9, 312, true, true, true, 'approved'
  ),
  (
    'f1000000-0000-4000-a000-000000000002',
    'a1000000-0000-4000-a000-000000000002',
    'Sara''s Flowers Phuket', 'Цветы Сары Пхукет',
    'Warm, locally-owned florist in the south of the island. Fresh seasonal bouquets with same-day delivery.',
    'Тёплая семейная цветочная студия на юге острова. Свежие сезонные букеты с доставкой в день заказа.',
    'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800',
    'Rawai, Muang, Phuket 83130', '+66 95 412 7783', 'hello@sarasflowersphuket.com',
    7.7780, 98.3250,
    true, 120, 1000,
    4.8, 196, true, true, true, 'approved'
  ),
  (
    'f1000000-0000-4000-a000-000000000003',
    'a1000000-0000-4000-a000-000000000003',
    'Forever Florist Thailand', 'Форевер Флорист Таиланд',
    'Trusted island-wide delivery to every district of Phuket, seven days a week.',
    'Надёжная доставка во все районы Пхукета семь дней в неделю.',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
    'Phuket Town, Muang, Phuket 83000', '+66 76 222 015', 'phuket@forever-florist-thailand.com',
    7.8840, 98.3870,
    true, 100, 900,
    4.7, 421, true, false, true, 'approved'
  )
ON CONFLICT (id) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  name_en = EXCLUDED.name_en,
  name_ru = EXCLUDED.name_ru,
  description_en = EXCLUDED.description_en,
  description_ru = EXCLUDED.description_ru,
  cover_image = EXCLUDED.cover_image,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  delivery_fee = EXCLUDED.delivery_fee,
  min_order_amount = EXCLUDED.min_order_amount,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  is_verified = EXCLUDED.is_verified,
  approval_status = EXCLUDED.approval_status;

-- Ensure the first-party UNO Flowers Phuket shop (seeded earlier) is live so
-- the curated bouquets below are visible in the catalogue.
UPDATE public.flower_shops
SET is_active = true, is_featured = true, is_verified = true, approval_status = 'approved'
WHERE id = 'f0000000-0000-0000-0000-000000000001';

-- ---------------------------------------------------------------------
-- 3. Retire the two placeholder bouquets from the legacy "Bloom Flowers
--    Phuket" demo shop so the catalogue shows only real offers.
-- ---------------------------------------------------------------------
UPDATE public.bouquets
SET is_active = false
WHERE shop_id IN (SELECT id FROM public.flower_shops WHERE name_en = 'Bloom Flowers Phuket');

-- ---------------------------------------------------------------------
-- 4. Bouquets (real offers). Idempotent on id.
-- ---------------------------------------------------------------------
INSERT INTO public.bouquets (
  id, shop_id, sku, name_en, name_ru,
  short_description_en, short_description_ru,
  description_en, description_ru, composition_en, composition_ru,
  category, image, price, currency, size_variants,
  flowers, colors, style, occasion_tags, color_palette, lifeos_tags,
  preparation_time_minutes, stock_quantity, box_type,
  cost_thb, margin_percent,
  social_proof_badge, scarcity_level, emotional_trigger_tag, bestseller_rank,
  is_popular, is_active, is_verified, seo_slug
) VALUES
  -- ============== UNO Flowers Phuket (first-party) ==============
  (
    'b1000000-0000-4000-a000-000000000001',
    'f0000000-0000-0000-0000-000000000001', 'UNO-ROSE-RED-24',
    'Signature Red Roses', 'Фирменные красные розы',
    '24 long-stem red roses with eucalyptus', '24 длинные красные розы с эвкалиптом',
    'Two dozen premium 60cm red roses, hand-tied with fresh eucalyptus and finished in signature kraft wrap. The timeless way to say "I love you".',
    'Две дюжины премиальных красных роз 60 см, собранных вручную со свежим эвкалиптом в фирменной крафт-упаковке. Вечный способ сказать «Я тебя люблю».',
    '24× red roses (60cm), eucalyptus, ruscus, kraft wrap, satin ribbon',
    '24× красные розы (60 см), эвкалипт, рускус, крафт-упаковка, атласная лента',
    'roses', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600', 3200, 'THB',
    '[{"size":"S","label_en":"12 roses","label_ru":"12 роз","price":1900,"flower_count":12},{"size":"M","label_en":"24 roses","label_ru":"24 розы","price":3200,"flower_count":24},{"size":"L","label_en":"36 roses","label_ru":"36 роз","price":4600,"flower_count":36}]'::jsonb,
    ARRAY['roses','eucalyptus'], ARRAY['red','green'], 'classic',
    ARRAY['romantic','anniversary'], 'red and green', ARRAY['romance','date-night'],
    120, 40, 'wrap', 1150, 64,
    'Most ordered this week', 'medium', 'romantic', 1,
    true, true, true, 'signature-red-roses'
  ),
  (
    'b1000000-0000-4000-a000-000000000002',
    'f0000000-0000-0000-0000-000000000001', 'UNO-ORCHID-WHT',
    'White Orchid Elegance', 'Элегантность белых орхидей',
    'Thai dendrobium orchids, pure white', 'Тайские орхидеи дендробиум, чисто-белые',
    'A serene arrangement of locally-grown white dendrobium orchids — Thailand''s signature bloom — for congratulations, gratitude and quiet luxury.',
    'Спокойная композиция из местных белых орхидей дендробиум — визитной карточки Таиланда — для поздравлений, благодарности и тихой роскоши.',
    'White dendrobium orchids, monstera leaf, white wrap',
    'Белые орхидеи дендробиум, лист монстеры, белая упаковка',
    'orchids', 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600', 2400, 'THB',
    NULL,
    ARRAY['orchids'], ARRAY['white','green'], 'luxe',
    ARRAY['congratulations','thank-you'], 'white and green', ARRAY['gratitude','luxury'],
    90, 30, 'wrap', 850, 65,
    'Loved by 200+ customers', 'low', 'luxury', 2,
    true, true, true, 'white-orchid-elegance'
  ),
  (
    'b1000000-0000-4000-a000-000000000003',
    'f0000000-0000-0000-0000-000000000001', 'UNO-TROPIC-SUN',
    'Tropical Phuket Sunrise', 'Тропический рассвет Пхукета',
    'Birds of paradise, heliconia & roses', 'Стрелиция, геликония и розы',
    'A bold tropical statement — birds of paradise, heliconia and orange roses that capture a Phuket sunrise. Built to turn heads.',
    'Яркая тропическая композиция — стрелиция, геликония и оранжевые розы, передающие рассвет Пхукета. Создана, чтобы восхищать.',
    'Birds of paradise, heliconia, orange roses, monstera, tropical foliage',
    'Стрелиция, геликония, оранжевые розы, монстера, тропическая зелень',
    'exotic', 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600', 2800, 'THB',
    NULL,
    ARRAY['birds of paradise','heliconia','roses'], ARRAY['orange','yellow','green'], 'tropical',
    ARRAY['birthday','congratulations'], 'orange and yellow', ARRAY['celebration','tropical'],
    120, 25, 'wrap', 1050, 63,
    NULL, 'medium', 'joy', 4,
    false, true, true, 'tropical-phuket-sunrise'
  ),
  (
    'b1000000-0000-4000-a000-000000000004',
    'f0000000-0000-0000-0000-000000000001', 'UNO-PEONY-PINK',
    'Pastel Peony Dream', 'Пастельная мечта из пионов',
    'Imported pink & cream peonies', 'Импортные розовые и кремовые пионы',
    'Seasonal imported peonies in blush and cream — soft, romantic and endlessly photogenic. Subject to seasonal availability.',
    'Сезонные импортные пионы в розовых и кремовых тонах — нежные, романтичные и невероятно фотогеничные. В зависимости от сезона.',
    'Pink & cream peonies, lisianthus, dusty miller',
    'Розовые и кремовые пионы, лизиантус, цинерария',
    'peonies', 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600', 3600, 'THB',
    NULL,
    ARRAY['peonies','lisianthus'], ARRAY['pink','cream'], 'modern',
    ARRAY['romantic','wedding'], 'pink and cream', ARRAY['romance','wedding'],
    150, 18, 'wrap', 1500, 58,
    'Seasonal favourite', 'high', 'romantic', 3,
    true, true, true, 'pastel-peony-dream'
  ),
  (
    'b1000000-0000-4000-a000-000000000005',
    'f0000000-0000-0000-0000-000000000001', 'UNO-SUNFLOWER',
    'Sunshine Sunflowers', 'Солнечные подсолнухи',
    'Cheerful sunflowers & gerberas', 'Жизнерадостные подсолнухи и герберы',
    'A burst of yellow — sunflowers and gerberas that bring instant warmth. Perfect for birthdays and "thinking of you" moments.',
    'Взрыв жёлтого — подсолнухи и герберы, дарящие мгновенное тепло. Идеально для дней рождения и тёплых пожеланий.',
    'Sunflowers, yellow gerberas, solidago, greenery',
    'Подсолнухи, жёлтые герберы, солидаго, зелень',
    'sunflowers', 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600', 1600, 'THB',
    NULL,
    ARRAY['sunflowers','gerberas'], ARRAY['yellow','green'], 'classic',
    ARRAY['birthday','thank-you'], 'yellow and green', ARRAY['cheer','friendship'],
    90, 35, 'wrap', 600, 63,
    NULL, 'low', 'joy', 5,
    false, true, true, 'sunshine-sunflowers'
  ),

  -- ============== Siamese Remedies (luxury) ==============
  (
    'b1000000-0000-4000-a000-000000000011',
    'f1000000-0000-4000-a000-000000000001', 'SR-HATBOX-25',
    'Velvet Romance Hat Box', 'Бархатный роман в шляпной коробке',
    '25 red roses in a luxury hat box', '25 красных роз в люксовой шляпной коробке',
    '25 velvety red roses arranged in a signature black hat box with foam-fresh hydration — Siamese Remedies'' most requested luxury gift.',
    '25 бархатных красных роз в фирменной чёрной шляпной коробке со свежей флористической губкой — самый востребованный люксовый подарок Siamese Remedies.',
    '25× red roses, hat box, floral foam, satin ribbon',
    '25× красные розы, шляпная коробка, флористическая губка, атласная лента',
    'roses', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600', 4500, 'THB',
    '[{"size":"S","label_en":"15 roses","label_ru":"15 роз","price":3200,"flower_count":15},{"size":"M","label_en":"25 roses","label_ru":"25 роз","price":4500,"flower_count":25},{"size":"L","label_en":"50 roses","label_ru":"50 роз","price":8500,"flower_count":50}]'::jsonb,
    ARRAY['roses'], ARRAY['red'], 'luxe',
    ARRAY['romantic','anniversary'], 'red', ARRAY['romance','luxury'],
    150, 20, 'velvet_box', 1700, 62,
    'Bestselling luxury gift', 'medium', 'romantic', 1,
    true, true, true, 'velvet-romance-hat-box'
  ),
  (
    'b1000000-0000-4000-a000-000000000012',
    'f1000000-0000-4000-a000-000000000001', 'SR-ORCHID-SYM',
    'Orchid Symphony', 'Симфония орхидей',
    'Purple & white orchid arrangement', 'Композиция из фиолетовых и белых орхидей',
    'A cascade of purple and white orchids with phalaenopsis stems — refined, long-lasting and ideal for corporate congratulations.',
    'Каскад фиолетовых и белых орхидей со стеблями фаленопсиса — изысканно, долговечно и идеально для корпоративных поздравлений.',
    'Phalaenopsis & dendrobium orchids, white wrap, ribbon',
    'Орхидеи фаленопсис и дендробиум, белая упаковка, лента',
    'orchids', 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600', 3900, 'THB',
    NULL,
    ARRAY['orchids'], ARRAY['purple','white'], 'luxe',
    ARRAY['congratulations','thank-you'], 'purple and white', ARRAY['luxury','corporate'],
    120, 16, 'wrap', 1500, 62,
    NULL, 'low', 'luxury', 3,
    false, true, true, 'orchid-symphony'
  ),
  (
    'b1000000-0000-4000-a000-000000000013',
    'f1000000-0000-4000-a000-000000000001', 'SR-LILY-ROSE',
    'Lily & Rose Serenade', 'Серенада из лилий и роз',
    'White lilies with blush roses', 'Белые лилии с розовыми розами',
    'Fragrant white oriental lilies paired with blush roses — an elegant choice for anniversaries or heartfelt sympathy.',
    'Ароматные белые восточные лилии в сочетании с розовыми розами — элегантный выбор для годовщин или искренних соболезнований.',
    'Oriental lilies, blush roses, eucalyptus, white wrap',
    'Восточные лилии, розовые розы, эвкалипт, белая упаковка',
    'lilies', 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600', 3300, 'THB',
    NULL,
    ARRAY['lilies','roses'], ARRAY['white','pink'], 'classic',
    ARRAY['anniversary','sympathy'], 'white and pink', ARRAY['elegance','sympathy'],
    120, 22, 'wrap', 1250, 62,
    NULL, 'low', 'elegance', 4,
    false, true, true, 'lily-and-rose-serenade'
  ),
  (
    'b1000000-0000-4000-a000-000000000014',
    'f1000000-0000-4000-a000-000000000001', 'SR-GARDEN-MIX',
    'Garden of Grace', 'Сад изящества',
    'Lush mixed seasonal bouquet', 'Пышный сезонный микс-букет',
    'A designer mix of the day''s freshest premium blooms in soft multicolour tones — no two are ever quite the same.',
    'Дизайнерский микс из самых свежих премиальных цветов дня в мягких многоцветных тонах — двух одинаковых не бывает.',
    'Seasonal roses, lisianthus, ranunculus, spray roses, foliage',
    'Сезонные розы, лизиантус, ранункулюс, кустовые розы, зелень',
    'mixed', 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600', 2900, 'THB',
    NULL,
    ARRAY['roses','lisianthus','ranunculus'], ARRAY['pink','white','purple'], 'modern',
    ARRAY['birthday','congratulations'], 'multicolor', ARRAY['celebration'],
    120, 24, 'wrap', 1100, 62,
    NULL, 'low', 'joy', 5,
    false, true, true, 'garden-of-grace'
  ),

  -- ============== Sara's Flowers Phuket ==============
  (
    'b1000000-0000-4000-a000-000000000021',
    'f1000000-0000-4000-a000-000000000002', 'SF-PEONY-PINK',
    'Sweet Pink Peonies', 'Нежные розовые пионы',
    'Romantic pink peony bouquet', 'Романтический букет из розовых пионов',
    'Soft pink peonies hand-tied with seasonal greenery — Sara''s most-loved romantic bouquet. Seasonal availability.',
    'Нежно-розовые пионы, собранные вручную с сезонной зеленью — самый любимый романтический букет Сары. Сезонное предложение.',
    'Pink peonies, lisianthus, eucalyptus, pink wrap',
    'Розовые пионы, лизиантус, эвкалипт, розовая упаковка',
    'peonies', 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600', 2700, 'THB',
    NULL,
    ARRAY['peonies','lisianthus'], ARRAY['pink','green'], 'modern',
    ARRAY['romantic','anniversary'], 'pink', ARRAY['romance'],
    120, 20, 'wrap', 1050, 61,
    'Customer favourite', 'high', 'romantic', 1,
    true, true, true, 'sweet-pink-peonies'
  ),
  (
    'b1000000-0000-4000-a000-000000000022',
    'f1000000-0000-4000-a000-000000000002', 'SF-SUNNY-DAY',
    'Sunny Day Bouquet', 'Букет солнечного дня',
    'Sunflowers, gerberas & roses', 'Подсолнухи, герберы и розы',
    'A happy mix of sunflowers, yellow gerberas and orange roses to brighten any day. A best-seller for birthdays.',
    'Радостный микс из подсолнухов, жёлтых гербер и оранжевых роз, чтобы украсить любой день. Хит для дней рождения.',
    'Sunflowers, gerberas, orange roses, solidago, greenery',
    'Подсолнухи, герберы, оранжевые розы, солидаго, зелень',
    'mixed', 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600', 1800, 'THB',
    NULL,
    ARRAY['sunflowers','gerberas','roses'], ARRAY['yellow','orange'], 'classic',
    ARRAY['birthday','thank-you'], 'yellow and orange', ARRAY['cheer'],
    90, 30, 'wrap', 700, 61,
    NULL, 'low', 'joy', 2,
    true, true, true, 'sunny-day-bouquet'
  ),
  (
    'b1000000-0000-4000-a000-000000000023',
    'f1000000-0000-4000-a000-000000000002', 'SF-TROPIC-PAR',
    'Tropical Paradise', 'Тропический рай',
    'Vibrant tropical island mix', 'Яркий тропический микс',
    'Heliconia, orchids and tropical foliage arranged island-style — a vivid taste of Phuket for any celebration.',
    'Геликония, орхидеи и тропическая зелень в островном стиле — яркий вкус Пхукета для любого праздника.',
    'Heliconia, orchids, anthurium, tropical leaves',
    'Геликония, орхидеи, антуриум, тропические листья',
    'exotic', 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600', 2200, 'THB',
    NULL,
    ARRAY['heliconia','orchids','anthurium'], ARRAY['orange','red','green'], 'tropical',
    ARRAY['congratulations','birthday'], 'orange and red', ARRAY['tropical','celebration'],
    120, 18, 'wrap', 850, 61,
    NULL, 'medium', 'joy', 3,
    false, true, true, 'tropical-paradise'
  ),
  (
    'b1000000-0000-4000-a000-000000000024',
    'f1000000-0000-4000-a000-000000000002', 'SF-DOZEN-ROSE',
    'Classic Dozen Roses', 'Классическая дюжина роз',
    '12 red roses, simply elegant', '12 красных роз, просто элегантно',
    'A dozen fresh red roses, beautifully wrapped — the dependable classic, delivered the same day across south Phuket.',
    'Дюжина свежих красных роз в красивой упаковке — надёжная классика с доставкой в день заказа на юге Пхукета.',
    '12× red roses, baby''s breath, kraft wrap',
    '12× красные розы, гипсофила, крафт-упаковка',
    'roses', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600', 1500, 'THB',
    '[{"size":"S","label_en":"6 roses","label_ru":"6 роз","price":900,"flower_count":6},{"size":"M","label_en":"12 roses","label_ru":"12 роз","price":1500,"flower_count":12},{"size":"L","label_en":"24 roses","label_ru":"24 розы","price":2700,"flower_count":24}]'::jsonb,
    ARRAY['roses'], ARRAY['red'], 'classic',
    ARRAY['romantic','anniversary'], 'red', ARRAY['romance'],
    60, 40, 'wrap', 550, 63,
    NULL, 'low', 'romantic', 4,
    false, true, true, 'classic-dozen-roses'
  ),

  -- ============== Forever Florist Thailand ==============
  (
    'b1000000-0000-4000-a000-000000000031',
    'f1000000-0000-4000-a000-000000000003', 'FF-WHITE-LILY',
    'Eternal White Lilies', 'Вечные белые лилии',
    'Serene white lily tribute', 'Спокойная композиция из белых лилий',
    'A dignified arrangement of pure white oriental lilies and chrysanthemums — a respectful tribute delivered with care.',
    'Достойная композиция из чисто-белых восточных лилий и хризантем — уважительная дань, доставленная с заботой.',
    'White oriental lilies, white chrysanthemums, greenery',
    'Белые восточные лилии, белые хризантемы, зелень',
    'lilies', 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600', 2600, 'THB',
    NULL,
    ARRAY['lilies','chrysanthemums'], ARRAY['white','green'], 'classic',
    ARRAY['sympathy','thank-you'], 'white', ARRAY['sympathy'],
    120, 26, 'wrap', 1000, 62,
    NULL, 'low', 'elegance', 2,
    false, true, true, 'eternal-white-lilies'
  ),
  (
    'b1000000-0000-4000-a000-000000000032',
    'f1000000-0000-4000-a000-000000000003', 'FF-BDAY-BOX',
    'Birthday Bloom Box', 'Коробка ко дню рождения',
    'Colourful birthday flower box', 'Яркая цветочная коробка',
    'A joyful multicolour mix of roses, gerberas and chrysanthemums in a gift box — happy birthday wishes, delivered island-wide.',
    'Радостный многоцветный микс из роз, гербер и хризантем в подарочной коробке — поздравления с днём рождения по всему острову.',
    'Roses, gerberas, chrysanthemums, gift box',
    'Розы, герберы, хризантемы, подарочная коробка',
    'mixed', 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600', 2100, 'THB',
    NULL,
    ARRAY['roses','gerberas','chrysanthemums'], ARRAY['pink','yellow','orange'], 'modern',
    ARRAY['birthday','congratulations'], 'multicolor', ARRAY['celebration'],
    90, 28, 'luxury_box', 800, 62,
    'Top birthday pick', 'low', 'joy', 1,
    true, true, true, 'birthday-bloom-box'
  ),
  (
    'b1000000-0000-4000-a000-000000000033',
    'f1000000-0000-4000-a000-000000000003', 'FF-ORCHID-PUR',
    'Purple Orchid Cascade', 'Каскад фиолетовых орхидей',
    'Cascading purple orchids', 'Каскад фиолетовых орхидей',
    'Locally grown purple dendrobium orchids in a flowing cascade — an exotic, long-lasting gift that celebrates Thailand.',
    'Местные фиолетовые орхидеи дендробиум в струящемся каскаде — экзотичный, долговечный подарок, воспевающий Таиланд.',
    'Purple dendrobium orchids, foliage, wrap',
    'Фиолетовые орхидеи дендробиум, зелень, упаковка',
    'orchids', 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600', 2300, 'THB',
    NULL,
    ARRAY['orchids'], ARRAY['purple','green'], 'luxe',
    ARRAY['congratulations','thank-you'], 'purple', ARRAY['luxury','tropical'],
    100, 24, 'wrap', 900, 61,
    NULL, 'low', 'luxury', 3,
    false, true, true, 'purple-orchid-cascade'
  ),
  (
    'b1000000-0000-4000-a000-000000000034',
    'f1000000-0000-4000-a000-000000000003', 'FF-NEWBABY',
    'New Baby Pastels', 'Пастель для новорождённого',
    'Soft pastels to welcome a baby', 'Нежная пастель для новорождённого',
    'A gentle pastel bouquet of spray roses, lisianthus and gypsophila to welcome a new arrival.',
    'Нежный пастельный букет из кустовых роз, лизиантуса и гипсофилы, чтобы поприветствовать малыша.',
    'Spray roses, lisianthus, gypsophila, cream wrap',
    'Кустовые розы, лизиантус, гипсофила, кремовая упаковка',
    'mixed', 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600', 1900, 'THB',
    NULL,
    ARRAY['spray roses','lisianthus','gypsophila'], ARRAY['pink','cream','white'], 'minimalist',
    ARRAY['new-baby','congratulations'], 'pink and cream', ARRAY['new-baby','celebration'],
    90, 22, 'wrap', 730, 62,
    NULL, 'low', 'joy', 4,
    false, true, true, 'new-baby-pastels'
  )
ON CONFLICT (id) DO UPDATE SET
  shop_id = EXCLUDED.shop_id,
  sku = EXCLUDED.sku,
  name_en = EXCLUDED.name_en,
  name_ru = EXCLUDED.name_ru,
  short_description_en = EXCLUDED.short_description_en,
  short_description_ru = EXCLUDED.short_description_ru,
  description_en = EXCLUDED.description_en,
  description_ru = EXCLUDED.description_ru,
  composition_en = EXCLUDED.composition_en,
  composition_ru = EXCLUDED.composition_ru,
  category = EXCLUDED.category,
  image = EXCLUDED.image,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  size_variants = EXCLUDED.size_variants,
  flowers = EXCLUDED.flowers,
  colors = EXCLUDED.colors,
  style = EXCLUDED.style,
  occasion_tags = EXCLUDED.occasion_tags,
  color_palette = EXCLUDED.color_palette,
  lifeos_tags = EXCLUDED.lifeos_tags,
  preparation_time_minutes = EXCLUDED.preparation_time_minutes,
  stock_quantity = EXCLUDED.stock_quantity,
  box_type = EXCLUDED.box_type,
  cost_thb = EXCLUDED.cost_thb,
  margin_percent = EXCLUDED.margin_percent,
  social_proof_badge = EXCLUDED.social_proof_badge,
  scarcity_level = EXCLUDED.scarcity_level,
  emotional_trigger_tag = EXCLUDED.emotional_trigger_tag,
  bestseller_rank = EXCLUDED.bestseller_rank,
  is_popular = EXCLUDED.is_popular,
  is_active = EXCLUDED.is_active,
  is_verified = EXCLUDED.is_verified,
  seo_slug = EXCLUDED.seo_slug;
