-- ─────────────────────────────────────────────────────────────────────────
-- Transfer launch follow-ups (2026-06-16):
--   1. Operator Klod — UPSERT with WhatsApp +66 62 965 5545
--   2. transport_destinations — spelling fixes + lat/lng backfill
--   3. + 6 missing pricing zones (Nai Harn / Naiyang / Mai Khao /
--      Cherngtalay / Layan / Laguna) so hotel-autocomplete zone-matching
--      can find them
--   4. transport_vehicle_types — add cover_image + images columns so the
--      frontend StepVehicle photo render has a place to read from
--
-- All steps idempotent; safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Operator Klod ──────────────────────────────────────────────────────
INSERT INTO public.transfer_operators (
  name, phone_whatsapp, email, is_primary, is_active, languages, notes
)
SELECT
  'Klod',
  '66629655545',
  NULL,
  true,
  true,
  ARRAY['en','th'],
  '{"role":"primary_operator","added_via":"transfer_launch_20260616","line_id":"TODO_UPDATE_FROM_DASHBOARD"}'
WHERE NOT EXISTS (
  SELECT 1 FROM public.transfer_operators WHERE name = 'Klod'
);

-- Sync phone / primary / active for an existing Klod row (covers the case
-- where the row pre-existed with the wrong number).
UPDATE public.transfer_operators
SET phone_whatsapp = '66629655545',
    is_active      = true,
    is_primary     = true,
    updated_at     = now()
WHERE name = 'Klod'
  AND (phone_whatsapp <> '66629655545' OR is_active = false OR is_primary = false);

-- Demote anyone else from primary so Klod is the unambiguous default
-- recipient for notify-transfer-booking's `.order('is_primary', desc)`.
UPDATE public.transfer_operators
SET is_primary = false, updated_at = now()
WHERE name <> 'Klod' AND is_primary = true;


-- 2. transport_destinations: spelling + lat/lng backfill ───────────────
-- Two-step swap because UNIQUE on name_en (if any) would block direct rename.
UPDATE public.transport_destinations
SET name_ru = 'Бангтао', name_en = 'Bangtao'
WHERE name_en = 'Bang Tao';

UPDATE public.transport_destinations
SET name_ru = 'Пхукет-Таун'
WHERE name_en = 'Phuket Town' AND name_ru = 'Пхукет Таун';

-- Backfill coordinates so hotel-autocomplete zone-matching has anything
-- to compare against. Values are the typical resort-strip centroids
-- (WGS-84). Re-running is a no-op when lat/lng already match.
UPDATE public.transport_destinations SET lat = 7.8964, lng = 98.2962 WHERE name_en = 'Patong Beach';
UPDATE public.transport_destinations SET lat = 7.8226, lng = 98.2987 WHERE name_en = 'Kata Beach';
UPDATE public.transport_destinations SET lat = 7.8467, lng = 98.2944 WHERE name_en = 'Karon Beach';
UPDATE public.transport_destinations SET lat = 7.7768, lng = 98.3267 WHERE name_en = 'Rawai';
UPDATE public.transport_destinations SET lat = 7.9559, lng = 98.2818 WHERE name_en = 'Kamala Beach';
UPDATE public.transport_destinations SET lat = 7.9789, lng = 98.2802 WHERE name_en = 'Surin Beach';
UPDATE public.transport_destinations SET lat = 7.9938, lng = 98.2945 WHERE name_en = 'Bangtao';
UPDATE public.transport_destinations SET lat = 7.8804, lng = 98.3923 WHERE name_en = 'Phuket Town';
UPDATE public.transport_destinations SET lat = 7.8442, lng = 98.3398 WHERE name_en = 'Chalong';


-- 3. transport_destinations: 6 missing pricing zones ───────────────────
INSERT INTO public.transport_destinations
  (type, name_en, name_ru, base_price, duration_minutes, lat, lng, is_popular, sort_order)
VALUES
  ('airport_transfer','Nai Harn','Най-Харн',1100,65,7.7773,98.3055,false,10),
  ('airport_transfer','Naiyang','Найянг',700,35,8.0866,98.3057,false,11),
  ('airport_transfer','Mai Khao','Май-Кхао',600,20,8.1567,98.3030,false,12),
  ('airport_transfer','Cherngtalay','Чернг-Талай',750,35,7.9908,98.2980,false,13),
  ('airport_transfer','Layan','Лаян',700,30,8.0080,98.2929,false,14),
  ('airport_transfer','Laguna Phuket','Лагуна',700,30,8.0019,98.2941,false,15)
ON CONFLICT DO NOTHING;


-- 4. transport_vehicle_types: photo columns ────────────────────────────
ALTER TABLE public.transport_vehicle_types
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'::text[];

-- Once the Hiace photos are uploaded to Supabase Storage, populate them
-- via a follow-up UPDATE (left commented because URLs aren't known yet):
-- UPDATE public.transport_vehicle_types
--   SET cover_image = 'https://kakkwibljrjsawxgnupk.supabase.co/storage/v1/object/public/transfer-vehicles/hiace-cover.jpg',
--       images = ARRAY[
--         'https://kakkwibljrjsawxgnupk.supabase.co/storage/v1/object/public/transfer-vehicles/hiace-1.jpg',
--         'https://kakkwibljrjsawxgnupk.supabase.co/storage/v1/object/public/transfer-vehicles/hiace-2.jpg'
--       ]
--   WHERE type = 'airport_transfer'
--     AND name_en ILIKE '%van%'
--     AND name_en NOT ILIKE '%lux%';
