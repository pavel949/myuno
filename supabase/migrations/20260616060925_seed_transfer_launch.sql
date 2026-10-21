-- ─────────────────────────────────────────────────────────────────────────
-- Transfer vertical seed: operator Songklod, Tourist Police meeting point,
-- Lux Toyota Alphard vehicle tier, Ignatev Estate provider.
--
-- Launch-day asks from the customer on 2026-06-16:
--   1. Operator Songklod (songklod2512s@gmail.com) joins the
--      transfer_operators roster so notify-transfer-booking + admin
--      email both reach him for every booking.
--   2. Tourist Police desk (1155, international arrivals) becomes the
--      canonical pickup point for from-airport+international bookings —
--      the frontend already shows the message and writes it into
--      orders.metadata.meeting_point.
--   3. Lux Toyota Alphard tier appears in the vehicle picker as a
--      flat 4500 THB option (any destination).
--   4. Ignatev Estate is added as the provider behind the Alphard so
--      reports + ClearView trail show who's behind the vehicle.
--
-- All inserts are idempotent — re-running the migration is safe.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Operator Songklod ────────────────────────────────────────────────────
-- IMPORTANT: phone_whatsapp is NOT NULL in the schema. The placeholder
-- "66000000000" must be replaced with Songklod's real WhatsApp number
-- before notifications can reach him; update via Supabase dashboard:
--     UPDATE transfer_operators SET phone_whatsapp = '<real number>'
--     WHERE email = 'songklod2512s@gmail.com';
-- (Line ID lives in notes JSON until a dedicated column lands.)
INSERT INTO public.transfer_operators (
  name, phone_whatsapp, email, is_primary, is_active, languages, notes
)
SELECT
  'Songklod',
  '66000000000',                                -- TODO: replace via dashboard
  'songklod2512s@gmail.com',
  true,                                          -- primary operator on duty
  true,
  ARRAY['en','th','ru'],
  '{"line_id": "TODO_UPDATE_FROM_DASHBOARD", "added_via": "20260616060925_seed_transfer_launch"}'
WHERE NOT EXISTS (
  SELECT 1 FROM public.transfer_operators
  WHERE email = 'songklod2512s@gmail.com'
);

-- 2. Tourist Police meeting point (HKT international arrivals) ────────────
INSERT INTO public.transfer_meeting_points (
  airport_code, code, name_en, name_ru, name_th,
  description_en, description_ru, description_th,
  google_maps_url, lat, lng, is_default, is_active
)
VALUES (
  'HKT',
  'hkt-international-tourist-police',
  'Tourist Police desk (international arrivals)',
  'Стойка туристической полиции (международный терминал)',
  'จุดบริการตำรวจท่องเที่ยว (อาคารผู้โดยสารระหว่างประเทศ)',
  'Tourist Police office (1155) inside the international arrivals hall — visible signage, English-speaking staff 24/7.',
  'Офис туристической полиции (1155) в зоне прилёта международного терминала — заметные указатели, англоговорящий персонал 24/7.',
  'สำนักงานตำรวจท่องเที่ยว (1155) ในห้องโถงผู้โดยสารขาเข้าระหว่างประเทศ',
  'https://maps.google.com/?q=Phuket+International+Airport+Tourist+Police',
  8.1132, 98.3169,
  true,                                          -- default for international arrivals
  true
)
ON CONFLICT (code) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ru = EXCLUDED.name_ru,
  name_th = EXCLUDED.name_th,
  description_en = EXCLUDED.description_en,
  description_ru = EXCLUDED.description_ru,
  description_th = EXCLUDED.description_th,
  google_maps_url = EXCLUDED.google_maps_url,
  is_default = EXCLUDED.is_default,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- 3. Ignatev Estate provider ──────────────────────────────────────────────
INSERT INTO public.providers (
  name, description_en, description_ru, phone, email, is_verified, is_active, trust_score
)
SELECT
  'Ignatev Estate',
  'Premium real-estate operator and concierge transport partner for myUNO.',
  'Премиум-оператор недвижимости и транспортный партнёр myUNO.',
  '+66922407355',
  'pavel@ignatevestate.com',
  true,
  true,
  5.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.providers WHERE name = 'Ignatev Estate'
);

-- 4. Lux Toyota Alphard vehicle tier (airport_transfer) ──────────────────
-- Flat 4500 THB to any destination on the island. Renders in StepVehicle
-- alongside the standard sedan/van options.
INSERT INTO public.transport_vehicle_types (
  type, name_en, name_ru, description_en, description_ru,
  icon, max_passengers, base_price, price_per_km, price_multiplier,
  features, eta_minutes, is_active, sort_order
)
SELECT
  'airport_transfer',
  'Lux Toyota Alphard',
  'Люкс Toyota Alphard',
  'Premium minivan with reclining captain chairs, panoramic roof, refreshments. Flat 4 500 THB to any destination on Phuket.',
  'Премиум-минивэн с раскладными капитанскими креслами, панорамной крышей, напитками. Фиксированная цена 4 500 ฿ в любую точку Пхукета.',
  '🚐',
  4,
  4500,
  0,
  1,
  ARRAY['leather_captain_seats','panoramic_roof','wifi','bottled_water','professional_driver','english_speaking'],
  20,
  true,
  10                                              -- after sedan/van (sort_order 1-9)
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_vehicle_types
  WHERE type = 'airport_transfer' AND name_en = 'Lux Toyota Alphard'
);

-- 5. Wire the Alphard transfer-route (catalog entry) to Ignatev Estate ───
-- For routes featuring the Alphard, set provider_id to Ignatev Estate so
-- reports + ClearView audit show the chain. (Existing transfers stay on
-- their current provider — we don't reassign the sedan/van fleet.)
INSERT INTO public.transfers (
  sku, name_en, name_ru,
  origin_en, origin_ru, destination_en, destination_ru,
  vehicle_type, passengers_max, one_way_price, round_trip_price,
  provider_id, is_active
)
SELECT
  'HKT-LUX-ALPHARD-ANY',
  'Phuket Airport → anywhere · Lux Toyota Alphard',
  'Аэропорт Пхукета → куда угодно · Люкс Toyota Alphard',
  'Phuket International Airport (HKT)',
  'Аэропорт Пхукета (HKT)',
  'Any destination on Phuket',
  'Любое место на Пхукете',
  'lux_van', 4, 4500, 8500,
  (SELECT id FROM public.providers WHERE name = 'Ignatev Estate' LIMIT 1),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.transfers WHERE sku = 'HKT-LUX-ALPHARD-ANY'
);
