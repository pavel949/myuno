
-- STEP 1: Schema extensions for yachts vertical
ALTER TABLE public.yachts
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS fuel_policy text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS insurance_included text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS insurance_notes text,
ADD COLUMN IF NOT EXISTS skipper_included text DEFAULT 'yes',
ADD COLUMN IF NOT EXISTS charter_options text[] DEFAULT '{full_day}',
ADD COLUMN IF NOT EXISTS booking_flow text DEFAULT 'in_app_request',
ADD COLUMN IF NOT EXISTS source_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS marketing_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS lifeos_context text DEFAULT 'luxury_leisure',
ADD COLUMN IF NOT EXISTS weather_dependency text DEFAULT 'high',
ADD COLUMN IF NOT EXISTS price_sunset numeric,
ADD COLUMN IF NOT EXISTS price_overnight numeric,
ADD COLUMN IF NOT EXISTS addons text[] DEFAULT '{}';

-- Fix yacht_type constraint
ALTER TABLE public.yachts DROP CONSTRAINT IF EXISTS yachts_yacht_type_check;
ALTER TABLE public.yachts ADD CONSTRAINT yachts_yacht_type_check 
  CHECK (yacht_type = ANY (ARRAY['yacht','catamaran','speedboat','sailing','motorboat','motor_yacht','sailing_yacht','superyacht','longtail']));

-- Remove provider_type constraint so yacht providers can be inserted
ALTER TABLE public.providers DROP CONSTRAINT IF EXISTS providers_provider_type_check;

-- Delete old placeholder yachts
DELETE FROM public.yachts WHERE provider_id IS NULL;

-- Yacht taxonomy
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order, is_active)
VALUES
  ('yacht_type','speedboat','Speedboat','Скоростной катер','🚤',1,true),
  ('yacht_type','motor_yacht','Motor Yacht','Моторная яхта','🛥️',2,true),
  ('yacht_type','sailing_yacht','Sailing Yacht','Парусная яхта','⛵',3,true),
  ('yacht_type','catamaran','Catamaran','Катамаран','🛶',4,true),
  ('yacht_type','longtail','Longtail Boat','Лонгтейл','🚣',5,true),
  ('yacht_type','superyacht','Superyacht','Суперяхта','🚢',6,true),
  ('charter_duration','half_day','Half Day (4-5h)','Полдня (4-5ч)','⏱️',1,true),
  ('charter_duration','full_day','Full Day (8-10h)','Полный день (8-10ч)','☀️',2,true),
  ('charter_duration','sunset','Sunset Cruise (2-3h)','Закатный круиз (2-3ч)','🌅',3,true),
  ('charter_duration','overnight','Overnight','С ночёвкой','🌙',4,true),
  ('charter_duration','multi_day','Multi-Day','Многодневный','📅',5,true),
  ('yacht_addon','skipper','Skipper / Captain','Шкипер / Капитан','👨‍✈️',1,true),
  ('yacht_addon','crew','Full Crew','Полный экипаж','👥',2,true),
  ('yacht_addon','fuel','Fuel','Топливо','⛽',3,true),
  ('yacht_addon','snorkeling','Snorkeling Equipment','Снаряжение для снорклинга','🤿',4,true),
  ('yacht_addon','paddleboard','SUP / Paddleboard','SUP / Падлборд','🏄',5,true),
  ('yacht_addon','catering','Catering / Food','Кейтеринг / Еда','🍽️',6,true),
  ('yacht_addon','alcohol','Alcohol Package','Алкогольный пакет','🍾',7,true),
  ('yacht_addon','dj_sound','DJ & Sound System','DJ и звук','🎵',8,true),
  ('yacht_addon','fishing','Fishing Equipment','Рыболовное снаряжение','🎣',9,true),
  ('yacht_addon','transfer','Transfer to Pier','Трансфер до пирса','🚗',10,true),
  ('yacht_addon','kayak','Kayak','Каяк','🛶',11,true),
  ('yacht_addon','jetski','Jet Ski','Гидроцикл','🏍️',12,true)
ON CONFLICT (lookup_type, value_key) DO NOTHING;
