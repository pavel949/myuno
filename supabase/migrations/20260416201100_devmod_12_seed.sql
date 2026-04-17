-- =============================================================
-- Developer Module | Migration 12: Dev seed data
--
-- FOR LOCAL DEVELOPMENT ONLY — do NOT apply to production.
-- Creates one verified developer "Peylaa Residences", one project,
-- one floor plan, and 50 units distributed across statuses.
--
-- To apply locally: included in normal migration sequence.
-- To exclude from prod: apply with `--exclude-migration` flag or
-- comment out before deploying.
-- =============================================================

DO $$
DECLARE
  v_developer_id  uuid := '11111111-1111-1111-1111-111111111111';
  v_project_id    uuid := '22222222-2222-2222-2222-222222222222';
  v_floor_plan_id uuid := '33333333-3333-3333-3333-333333333333';
  v_i             integer;
  v_status        text;
  v_bedrooms      integer;
  v_price_thb     numeric;
BEGIN

  -- ─────────────────────────────────────────────
  -- Developer: Peylaa Residences
  -- ─────────────────────────────────────────────
  INSERT INTO public.developers (
    id, name_en, name_ru, slug,
    legal_name, display_name, country,
    description_en, description_ru,
    website, is_verified, is_featured, is_active,
    devmod_status, verified_at,
    created_at, updated_at
  )
  VALUES (
    v_developer_id,
    'Peylaa Residences', 'Пейлаа Резиденс', 'peylaa-residences',
    'Peylaa Development Co., Ltd.', 'Peylaa Residences', 'TH',
    'Award-winning Phuket developer with 10+ years of luxury residential projects.',
    'Застройщик премиум-жилья на Пхукете с 10-летней историей.',
    'https://peylaa.com', true, true, true,
    'active', now(),
    now(), now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ─────────────────────────────────────────────
  -- Project: Peylaa Sky Residences
  -- ─────────────────────────────────────────────
  INSERT INTO public.property_projects (
    id, name_en, name_ru,
    developer_id, developer_name, slug,
    description_en, description_ru,
    district, lat, lng,
    location_lat, location_lng,
    is_active, is_featured, is_approved,
    public_listing_enabled,
    project_status, construction_phase, construction_progress,
    completion_date,
    total_units, units_available, available_units,
    price_from, price_to,
    price_from_thb, price_to_thb,
    cover_image_url,
    created_at, updated_at
  )
  VALUES (
    v_project_id,
    'Peylaa Sky Residences', 'Пейлаа Скай Резиденс',
    v_developer_id, 'Peylaa Residences', 'peylaa-sky-residences',
    'A 50-unit luxury condominium in the heart of Kamala with panoramic sea views.',
    '50 апартаментов премиум-класса в Камале с панорамным видом на море.',
    'Kamala', 7.9523, 98.2821,
    7.9523, 98.2821,
    true, true, true,
    true,
    'offplan', 'structure', 35,
    '2027-12-31',
    50, 30, 30,
    4500000, 15000000,
    4500000, 15000000,
    'https://placehold.co/1200x800/0d6e4f/ffffff?text=Peylaa+Sky',
    now(), now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ─────────────────────────────────────────────
  -- Floor Plan: Level 1–10 overview
  -- ─────────────────────────────────────────────
  INSERT INTO public.floor_plans (
    id, project_id, name, display_order,
    image_url, image_width_px, image_height_px,
    version, created_at, updated_at
  )
  VALUES (
    v_floor_plan_id,
    v_project_id, 'All Floors Overview', 1,
    'https://placehold.co/1600x1200/f0fdf4/0d6e4f?text=Floor+Plan', 1600, 1200,
    1, now(), now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ─────────────────────────────────────────────
  -- 50 Units with realistic distribution:
  --   30 available, 5 soft_hold, 3 reserved, 12 sold
  -- ─────────────────────────────────────────────
  FOR v_i IN 1..50 LOOP

    -- Determine unit_status by index range
    v_status := CASE
      WHEN v_i <= 30 THEN 'available'
      WHEN v_i <= 35 THEN 'soft_hold'
      WHEN v_i <= 38 THEN 'reserved'
      ELSE 'sold'
    END;

    -- Alternate between studio/1BR/2BR/3BR
    v_bedrooms := CASE (v_i % 4)
      WHEN 0 THEN 0   -- studio
      WHEN 1 THEN 1
      WHEN 2 THEN 2
      ELSE 3
    END;

    v_price_thb := CASE v_bedrooms
      WHEN 0 THEN 4500000 + (v_i * 50000)
      WHEN 1 THEN 6500000 + (v_i * 80000)
      WHEN 2 THEN 9500000 + (v_i * 100000)
      ELSE       13000000 + (v_i * 120000)
    END;

    INSERT INTO public.project_units (
      project_id, floor_plan_id,
      unit_code, unit_type,
      floor, floor_number,
      area_sqm, size_sqm,
      bedrooms, bathrooms,
      price, price_thb, currency,
      unit_status, status_version,
      ownership_type,
      sold_via_myuno,
      -- Place pins in a 5×10 grid (% positions)
      pin_x_pct, pin_y_pct,
      created_by,
      created_at, updated_at
    )
    VALUES (
      v_project_id, v_floor_plan_id,
      'SKY-' || lpad(v_i::text, 3, '0'),
      CASE v_bedrooms WHEN 0 THEN 'studio' WHEN 1 THEN '1BR' WHEN 2 THEN '2BR' ELSE '3BR' END,
      ceil(v_i::numeric / 5)::integer,   -- floors 1–10
      ceil(v_i::numeric / 5)::integer,
      CASE v_bedrooms WHEN 0 THEN 35 WHEN 1 THEN 55 WHEN 2 THEN 80 ELSE 120 END,
      CASE v_bedrooms WHEN 0 THEN 35 WHEN 1 THEN 55 WHEN 2 THEN 80 ELSE 120 END,
      v_bedrooms,
      GREATEST(1, v_bedrooms),
      v_price_thb, v_price_thb, 'THB',
      v_status, 1,
      CASE (v_i % 2) WHEN 0 THEN 'foreign_quota' ELSE 'thai_quota' END,
      v_status = 'sold',
      -- 5 columns × 10 rows grid
      10 + ((v_i - 1) % 5) * 18,
      10 + (ceil(v_i::numeric / 5)::integer - 1) * 9,
      NULL,
      now(), now()
    )
    ON CONFLICT DO NOTHING;

  END LOOP;

END $$;
