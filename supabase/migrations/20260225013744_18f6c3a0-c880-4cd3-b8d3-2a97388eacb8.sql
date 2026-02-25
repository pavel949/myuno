
-- 1. Property Rate Seasons (Seasonal pricing / dynamic rates)
CREATE TABLE IF NOT EXISTS public.property_rate_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  nightly_rate NUMERIC NOT NULL DEFAULT 0,
  weekly_rate NUMERIC,
  monthly_rate NUMERIC,
  min_stay_nights INT DEFAULT 1,
  currency TEXT DEFAULT 'THB',
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.property_rate_seasons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'property_rate_seasons' AND policyname = 'Owners manage own rate seasons') THEN
    CREATE POLICY "Owners manage own rate seasons" ON public.property_rate_seasons FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
  END IF;
END $$;

-- 2. Property Reviews (OTA review aggregation)
CREATE TABLE IF NOT EXISTS public.property_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  platform TEXT NOT NULL DEFAULT 'manual',
  guest_name TEXT,
  rating NUMERIC,
  review_text TEXT,
  review_date DATE,
  response_text TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID,
  sentiment TEXT,
  language TEXT DEFAULT 'en',
  external_id TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'property_reviews' AND policyname = 'Owners manage own reviews') THEN
    CREATE POLICY "Owners manage own reviews" ON public.property_reviews FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
  END IF;
END $$;

-- 3. Add missing columns to existing property_documents if needed
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'doc_type') THEN
    ALTER TABLE public.property_documents ADD COLUMN doc_type TEXT DEFAULT 'other';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'expiry_date') THEN
    ALTER TABLE public.property_documents ADD COLUMN expiry_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'reminder_days') THEN
    ALTER TABLE public.property_documents ADD COLUMN reminder_days INT DEFAULT 30;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'coverage_amount') THEN
    ALTER TABLE public.property_documents ADD COLUMN coverage_amount NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'provider_name') THEN
    ALTER TABLE public.property_documents ADD COLUMN provider_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'provider_contact') THEN
    ALTER TABLE public.property_documents ADD COLUMN provider_contact TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'policy_number') THEN
    ALTER TABLE public.property_documents ADD COLUMN policy_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'issue_date') THEN
    ALTER TABLE public.property_documents ADD COLUMN issue_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'status') THEN
    ALTER TABLE public.property_documents ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'tags') THEN
    ALTER TABLE public.property_documents ADD COLUMN tags TEXT[];
  END IF;
END $$;

-- 4. Owner Reports
CREATE TABLE IF NOT EXISTS public.owner_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.management_companies(id),
  report_type TEXT NOT NULL DEFAULT 'monthly',
  title TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  file_url TEXT,
  status TEXT DEFAULT 'draft',
  sent_to TEXT[],
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.owner_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'owner_reports' AND policyname = 'Owners manage own reports') THEN
    CREATE POLICY "Owners manage own reports" ON public.owner_reports FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
  END IF;
END $$;

-- Indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_rate_seasons_property ON public.property_rate_seasons(property_id);
CREATE INDEX IF NOT EXISTS idx_rate_seasons_dates ON public.property_rate_seasons(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reviews_property ON public.property_reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_platform ON public.property_reviews(platform);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON public.property_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_reports_owner ON public.owner_reports(owner_id);
CREATE INDEX IF NOT EXISTS idx_reports_period ON public.owner_reports(period_start, period_end);
