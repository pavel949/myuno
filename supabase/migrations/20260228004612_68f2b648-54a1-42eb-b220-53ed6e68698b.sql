
-- ============================================================
-- Phase 1: Create unified LISTINGS table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical TEXT NOT NULL,
  category TEXT,
  name_en TEXT NOT NULL,
  name_ru TEXT,
  description_en TEXT,
  description_ru TEXT,
  slug TEXT,
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  address TEXT,
  district TEXT,
  lat NUMERIC,
  lng NUMERIC,
  price NUMERIC,
  price_period TEXT,
  currency TEXT DEFAULT 'THB',
  phone TEXT,
  email TEXT,
  website TEXT,
  working_hours JSONB,
  provider_id UUID REFERENCES public.providers(id),
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  approval_status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_by_uno_team BOOLEAN DEFAULT false,
  uno_team_creator_id UUID,
  attributes JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_vertical ON public.listings(vertical);
CREATE INDEX IF NOT EXISTS idx_listings_vertical_active ON public.listings(vertical, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_listings_provider_id ON public.listings(provider_id);
CREATE INDEX IF NOT EXISTS idx_listings_approval ON public.listings(approval_status);
CREATE INDEX IF NOT EXISTS idx_listings_district ON public.listings(district);
CREATE INDEX IF NOT EXISTS idx_listings_slug ON public.listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_attributes ON public.listings USING gin(attributes);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings_public_read" ON public.listings
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND (approval_status = 'approved' OR approval_status IS NULL));

CREATE POLICY "listings_provider_manage" ON public.listings
  FOR ALL TO authenticated
  USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()))
  WITH CHECK (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

CREATE POLICY "listings_admin_full" ON public.listings
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin'::app_role, 'uno_team'::app_role))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin'::app_role, 'uno_team'::app_role))
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.fn_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.fn_listings_updated_at();
