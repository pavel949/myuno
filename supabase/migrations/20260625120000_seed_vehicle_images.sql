-- ============================================================
-- Seed cover_image / images for the rental catalog (/transport).
-- ------------------------------------------------------------
-- The ~32 seeded vehicles (listings.vertical='vehicle') were inserted with
-- NULL cover_image, so the catalog rendered placeholders. This maps each row
-- to a real local asset already shipped in public/catalog/vehicles/*.jpg
-- (served at /catalog/vehicles/<file>.jpg). useVehicles.transformVehicle()
-- passes cover_image/images straight through — no code change required.
--
-- Strategy: (1) set a sensible per-category default for every vehicle row,
-- then (2) override with model-specific photos where an exact asset exists.
-- Idempotent: safe to re-run (pure UPDATEs keyed on category/name).
-- ============================================================

-- 1) Per-category defaults --------------------------------------------------
UPDATE public.listings SET
  cover_image = '/catalog/vehicles/toyota-corolla.jpg',
  images = ARRAY['/catalog/vehicles/toyota-corolla.jpg']::text[],
  updated_at = now()
WHERE vertical = 'vehicle' AND category = 'sedan';

UPDATE public.listings SET
  cover_image = '/catalog/vehicles/toyota-yaris.jpg',
  images = ARRAY['/catalog/vehicles/toyota-yaris.jpg']::text[],
  updated_at = now()
WHERE vertical = 'vehicle' AND category IN ('compact', 'economy');

UPDATE public.listings SET
  cover_image = '/catalog/vehicles/toyota-fortuner.jpg',
  images = ARRAY['/catalog/vehicles/toyota-fortuner.jpg']::text[],
  updated_at = now()
WHERE vertical = 'vehicle' AND category = 'suv';

UPDATE public.listings SET
  cover_image = '/catalog/vehicles/toyota-hilux.jpg',
  images = ARRAY['/catalog/vehicles/toyota-hilux.jpg']::text[],
  updated_at = now()
WHERE vertical = 'vehicle' AND category = 'pickup';

-- No dedicated van/MPV photo — mitsubishi-pajero is the closest large vehicle.
UPDATE public.listings SET
  cover_image = '/catalog/vehicles/mitsubishi-pajero.jpg',
  images = ARRAY['/catalog/vehicles/mitsubishi-pajero.jpg']::text[],
  updated_at = now()
WHERE vertical = 'vehicle' AND category = 'van';

-- No luxury-car photo — honda-civic is an acceptable premium-sedan stand-in.
UPDATE public.listings SET
  cover_image = '/catalog/vehicles/honda-civic.jpg',
  images = ARRAY['/catalog/vehicles/honda-civic.jpg']::text[],
  updated_at = now()
WHERE vertical = 'vehicle' AND category = 'luxury';

UPDATE public.listings SET
  cover_image = '/catalog/vehicles/honda-forza-350.jpg',
  images = ARRAY['/catalog/vehicles/honda-forza-350.jpg']::text[],
  updated_at = now()
WHERE vertical = 'vehicle' AND category = 'motorcycle';

UPDATE public.listings SET
  cover_image = '/catalog/vehicles/honda-pcx-160.jpg',
  images = ARRAY['/catalog/vehicles/honda-pcx-160.jpg']::text[],
  updated_at = now()
WHERE vertical = 'vehicle' AND category = 'scooter';

UPDATE public.listings SET
  cover_image = '/catalog/vehicles/electric-scooter.jpg',
  images = ARRAY['/catalog/vehicles/electric-scooter.jpg']::text[],
  updated_at = now()
WHERE vertical = 'vehicle' AND category = 'electric';

-- Catch-all for any vehicle row whose category did not match above.
UPDATE public.listings SET
  cover_image = '/catalog/vehicles/toyota-corolla.jpg',
  images = ARRAY['/catalog/vehicles/toyota-corolla.jpg']::text[],
  updated_at = now()
WHERE vertical = 'vehicle' AND (cover_image IS NULL OR cover_image = '');

-- 2) Model-specific overrides (exact assets) --------------------------------
-- name_en matches the seed in 20260206172639 / 20260513190000.
UPDATE public.listings SET cover_image = '/catalog/vehicles/toyota-yaris.jpg',     images = ARRAY['/catalog/vehicles/toyota-yaris.jpg']::text[],     updated_at = now() WHERE vertical = 'vehicle' AND name_en ILIKE '%yaris%';
UPDATE public.listings SET cover_image = '/catalog/vehicles/toyota-vios.jpg',      images = ARRAY['/catalog/vehicles/toyota-vios.jpg']::text[],      updated_at = now() WHERE vertical = 'vehicle' AND name_en ILIKE '%vios%';
UPDATE public.listings SET cover_image = '/catalog/vehicles/toyota-corolla.jpg',   images = ARRAY['/catalog/vehicles/toyota-corolla.jpg']::text[],   updated_at = now() WHERE vertical = 'vehicle' AND (name_en ILIKE '%corolla%' OR name_en ILIKE '%altis%');
UPDATE public.listings SET cover_image = '/catalog/vehicles/toyota-fortuner.jpg',  images = ARRAY['/catalog/vehicles/toyota-fortuner.jpg']::text[],  updated_at = now() WHERE vertical = 'vehicle' AND name_en ILIKE '%fortuner%';
UPDATE public.listings SET cover_image = '/catalog/vehicles/toyota-hilux.jpg',     images = ARRAY['/catalog/vehicles/toyota-hilux.jpg']::text[],     updated_at = now() WHERE vertical = 'vehicle' AND name_en ILIKE '%hilux%';
UPDATE public.listings SET cover_image = '/catalog/vehicles/honda-city.jpg',       images = ARRAY['/catalog/vehicles/honda-city.jpg']::text[],       updated_at = now() WHERE vertical = 'vehicle' AND name_en ILIKE '%city%';
UPDATE public.listings SET cover_image = '/catalog/vehicles/nissan-almera.jpg',    images = ARRAY['/catalog/vehicles/nissan-almera.jpg']::text[],    updated_at = now() WHERE vertical = 'vehicle' AND name_en ILIKE '%nissan march%';
UPDATE public.listings SET cover_image = '/catalog/vehicles/budget-compact.jpg',   images = ARRAY['/catalog/vehicles/budget-compact.jpg']::text[],   updated_at = now() WHERE vertical = 'vehicle' AND name_en ILIKE '%mazda 2%';
UPDATE public.listings SET cover_image = '/catalog/vehicles/mitsubishi-pajero.jpg',images = ARRAY['/catalog/vehicles/mitsubishi-pajero.jpg']::text[],updated_at = now() WHERE vertical = 'vehicle' AND name_en ILIKE '%everest%';
UPDATE public.listings SET cover_image = '/catalog/vehicles/honda-pcx-160.jpg',    images = ARRAY['/catalog/vehicles/honda-pcx-160.jpg']::text[],    updated_at = now() WHERE vertical = 'vehicle' AND name_en ILIKE '%pcx%';
UPDATE public.listings SET cover_image = '/catalog/vehicles/honda-forza-350.jpg',  images = ARRAY['/catalog/vehicles/honda-forza-350.jpg']::text[],  updated_at = now() WHERE vertical = 'vehicle' AND name_en ILIKE '%cb500%';
