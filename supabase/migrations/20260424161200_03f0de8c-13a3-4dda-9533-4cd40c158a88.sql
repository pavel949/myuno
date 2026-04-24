-- ============================================================================
-- 1. PROPERTIES — новые колонки под 6 треков сделок
-- ============================================================================

ALTER TABLE public.properties
  -- Tenancy modes (мульти-режим аренды)
  ADD COLUMN IF NOT EXISTS tenancy_modes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price_per_month numeric,
  ADD COLUMN IF NOT EXISTS price_per_year numeric,
  ADD COLUMN IF NOT EXISTS deposit_months_long numeric DEFAULT 2,
  ADD COLUMN IF NOT EXISTS advance_months_long numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS min_lease_months integer,
  ADD COLUMN IF NOT EXISTS utilities_included_long text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tm30_registration_supported boolean DEFAULT false,
  -- Sale intent
  ADD COLUMN IF NOT EXISTS sale_intent text,
  ADD COLUMN IF NOT EXISTS is_assignment boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS assignment_premium numeric,
  ADD COLUMN IF NOT EXISTS original_contract_price numeric,
  ADD COLUMN IF NOT EXISTS remaining_to_developer numeric,
  ADD COLUMN IF NOT EXISTS spa_stage text,
  ADD COLUMN IF NOT EXISTS transfer_fee_split text,
  -- Quick sale / distressed
  ADD COLUMN IF NOT EXISTS is_quick_sale boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS quick_sale_reason text,
  ADD COLUMN IF NOT EXISTS quick_sale_discount_pct numeric,
  ADD COLUMN IF NOT EXISTS urgency_deadline date,
  -- Payment options
  ADD COLUMN IF NOT EXISTS accepts_installments boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS installment_plan jsonb,
  ADD COLUMN IF NOT EXISTS escrow_offered boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS escrow_provider text,
  -- Юридическая готовность
  ADD COLUMN IF NOT EXISTS title_deed_type text,
  ADD COLUMN IF NOT EXISTS title_deed_url text,
  ADD COLUMN IF NOT EXISTS encumbrances_disclosed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS encumbrances_description text,
  ADD COLUMN IF NOT EXISTS foreign_quota_available boolean,
  -- Видео-тур
  ADD COLUMN IF NOT EXISTS video_file_url text,
  ADD COLUMN IF NOT EXISTS virtual_tour_url text;

-- Validation triggers (вместо CHECK constraints — гибко и не ломает RLS)

CREATE OR REPLACE FUNCTION public.validate_property_tracks()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- sale_intent
  IF NEW.sale_intent IS NOT NULL
     AND NEW.sale_intent NOT IN ('standard','assignment','quick_sale') THEN
    RAISE EXCEPTION 'Invalid sale_intent: %', NEW.sale_intent;
  END IF;

  -- transfer_fee_split
  IF NEW.transfer_fee_split IS NOT NULL
     AND NEW.transfer_fee_split NOT IN ('buyer','seller','50_50') THEN
    RAISE EXCEPTION 'Invalid transfer_fee_split: %', NEW.transfer_fee_split;
  END IF;

  -- escrow_provider
  IF NEW.escrow_provider IS NOT NULL
     AND NEW.escrow_provider NOT IN ('platform','lawyer','bank','other') THEN
    RAISE EXCEPTION 'Invalid escrow_provider: %', NEW.escrow_provider;
  END IF;

  -- quick_sale_reason
  IF NEW.quick_sale_reason IS NOT NULL
     AND NEW.quick_sale_reason NOT IN ('relocation','divorce','financial','business','inheritance','health','other') THEN
    RAISE EXCEPTION 'Invalid quick_sale_reason: %', NEW.quick_sale_reason;
  END IF;

  -- title_deed_type
  IF NEW.title_deed_type IS NOT NULL
     AND NEW.title_deed_type NOT IN ('chanote','nor_sor_3_gor','nor_sor_3','sor_kor_1','leasehold','company_owned','other') THEN
    RAISE EXCEPTION 'Invalid title_deed_type: %', NEW.title_deed_type;
  END IF;

  -- spa_stage
  IF NEW.spa_stage IS NOT NULL
     AND NEW.spa_stage NOT IN ('reservation','booking','contract_signed','dbd_registered','transferred') THEN
    RAISE EXCEPTION 'Invalid spa_stage: %', NEW.spa_stage;
  END IF;

  -- tenancy_modes elements
  IF NEW.tenancy_modes IS NOT NULL THEN
    PERFORM 1 FROM unnest(NEW.tenancy_modes) AS m
    WHERE m NOT IN ('short','medium','long');
    IF FOUND THEN
      RAISE EXCEPTION 'Invalid tenancy_modes element';
    END IF;
  END IF;

  -- quick_sale_discount_pct sane bounds
  IF NEW.quick_sale_discount_pct IS NOT NULL
     AND (NEW.quick_sale_discount_pct < 0 OR NEW.quick_sale_discount_pct > 90) THEN
    RAISE EXCEPTION 'quick_sale_discount_pct must be between 0 and 90';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_property_tracks_trg ON public.properties;
CREATE TRIGGER validate_property_tracks_trg
BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.validate_property_tracks();

-- Индексы под новые фильтры каталога
CREATE INDEX IF NOT EXISTS idx_properties_tenancy_modes ON public.properties USING GIN(tenancy_modes);
CREATE INDEX IF NOT EXISTS idx_properties_sale_intent ON public.properties(sale_intent) WHERE sale_intent IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_is_assignment ON public.properties(is_assignment) WHERE is_assignment = true;
CREATE INDEX IF NOT EXISTS idx_properties_is_quick_sale ON public.properties(is_quick_sale) WHERE is_quick_sale = true;

-- ============================================================================
-- 2. STORAGE BUCKET для видео-туров
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-videos',
  'property-videos',
  true,
  524288000,  -- 500 MB
  ARRAY['video/mp4','video/quicktime','video/webm','video/x-m4v']
)
ON CONFLICT (id) DO UPDATE
SET file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    public = EXCLUDED.public;

-- Public read
DROP POLICY IF EXISTS "property-videos public read" ON storage.objects;
CREATE POLICY "property-videos public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-videos');

-- Owner / managed_by_org write
DROP POLICY IF EXISTS "property-videos owner upload" ON storage.objects;
CREATE POLICY "property-videos owner upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-videos'
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "property-videos owner update" ON storage.objects;
CREATE POLICY "property-videos owner update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "property-videos owner delete" ON storage.objects;
CREATE POLICY "property-videos owner delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- 3. BACKFILL существующих объектов
-- ============================================================================

UPDATE public.properties
SET tenancy_modes = CASE
  WHEN price_per_night IS NOT NULL AND COALESCE(min_stay_nights,1) < 30 THEN ARRAY['short']
  WHEN price_per_night IS NOT NULL AND COALESCE(min_stay_nights,1) >= 30 THEN ARRAY['long']
  WHEN 'rent' = ANY(COALESCE(listing_modes, ARRAY['rent'])) THEN ARRAY['short']
  ELSE '{}'::text[]
END
WHERE tenancy_modes IS NULL OR tenancy_modes = '{}'::text[];

-- Sale intent для тех, кто sale
UPDATE public.properties
SET sale_intent = 'standard'
WHERE sale_intent IS NULL
  AND (sale_price IS NOT NULL OR 'sale' = ANY(COALESCE(listing_modes, '{}'::text[])));