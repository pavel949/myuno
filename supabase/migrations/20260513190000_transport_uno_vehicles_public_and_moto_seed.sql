-- Transport: UNO-seeded vehicle rows were copied to listings with approval_status = pending
-- (default on vehicles after Jan 2026). listings_public_read RLS only exposes approved|NULL.
--
-- Manual verification on PRIMARY (Supabase SQL editor, read-only):
--   SELECT count(*) FROM public.listings WHERE vertical = 'vehicle' AND is_active = true;
--   SELECT approval_status, count(*) FROM public.listings WHERE vertical = 'vehicle' GROUP BY 1;
--   SELECT count(*) FROM public.vehicles WHERE is_active = true;
--
-- Idempotent: safe to re-run.

-- 1) Approve curated UNO vehicle inventory in unified listings (what /transport reads).
UPDATE public.listings
SET
  approval_status = 'approved',
  updated_at = now()
WHERE vertical = 'vehicle'
  AND is_active = true
  AND approval_status = 'pending'
  AND created_by_uno_team IS TRUE;

-- 2) Keep legacy vehicles table aligned for admin/vendor surfaces that still read it.
UPDATE public.vehicles
SET
  approval_status = 'approved',
  updated_at = now()
WHERE is_active = true
  AND approval_status = 'pending'
  AND created_by_uno_team IS TRUE;

-- 3) Minimal motorcycle + scooter seed (listings-only; car batch in 20260206172639 had no moto).
INSERT INTO public.listings (
  id,
  vertical,
  category,
  name_en,
  name_ru,
  description_en,
  description_ru,
  cover_image,
  images,
  address,
  price,
  price_period,
  currency,
  provider_id,
  rating,
  review_count,
  is_active,
  is_featured,
  is_verified,
  approval_status,
  created_by_uno_team,
  features,
  attributes
)
VALUES
  (
    'a2000001-0000-0000-0000-000000000001',
    'vehicle',
    'motorcycle',
    'Honda CB500X (Phuket)',
    'Honda CB500X (Пхукет)',
    'Adventure 500cc rental. Helmet included. Min 1 day.',
    'Аренда адвенчер 500cc. Шлем включён. Мин. 1 день.',
    NULL,
    '{}'::text[],
    'Patong / Rawai delivery',
    590,
    'day',
    'THB',
    'a1000001-0000-0000-0000-000000000002',
    0,
    0,
    true,
    false,
    true,
    'approved',
    true,
    ARRAY['insurance_included', 'helmet_included']::text[],
    jsonb_build_object(
      'vehicle_type', 'motorcycle',
      'brand', 'Honda',
      'capacity', 2,
      'doors', 0,
      'transmission', 'manual',
      'fuel_type', 'petrol',
      'min_rental_days', 1,
      'helmet_included', true
    )
  ),
  (
    'a2000001-0000-0000-0000-000000000002',
    'vehicle',
    'scooter',
    'Honda PCX 160',
    'Honda PCX 160',
    'Automatic scooter. Two helmets, insurance. Island-wide delivery.',
    'Скутер автомат. Два шлема, страховка. Доставка по острову.',
    NULL,
    '{}'::text[],
    'Island-wide delivery',
    350,
    'day',
    'THB',
    'a1000001-0000-0000-0000-000000000002',
    0,
    0,
    true,
    false,
    true,
    'approved',
    true,
    ARRAY['insurance_included', 'helmet_included']::text[],
    jsonb_build_object(
      'vehicle_type', 'scooter',
      'brand', 'Honda',
      'capacity', 2,
      'doors', 0,
      'transmission', 'automatic',
      'fuel_type', 'petrol',
      'min_rental_days', 1,
      'helmet_included', true
    )
  )
ON CONFLICT (id) DO NOTHING;
