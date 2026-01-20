-- Extend platform_metrics with M&A critical fields
ALTER TABLE public.platform_metrics
ADD COLUMN IF NOT EXISTS avg_order_value NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS repeat_purchase_rate NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cross_sell_rate NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dau INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mau INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_session_duration_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS d7_retention NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS d30_retention NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS property_listings_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS property_occupancy_rate NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS property_adr NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS property_gmv NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tours_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tours_gmv NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tours_avg_rating NUMERIC(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS yachts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS yachts_gmv NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_take_rate NUMERIC(5,2) DEFAULT 10,
ADD COLUMN IF NOT EXISTS gross_margin NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ltv NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cac NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ltv_cac_ratio NUMERIC(5,2) DEFAULT 0;

-- Create cohort_metrics table for retention analysis
CREATE TABLE IF NOT EXISTS public.cohort_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_date DATE NOT NULL,
  cohort_size INTEGER NOT NULL DEFAULT 0,
  d1_retained INTEGER DEFAULT 0,
  d7_retained INTEGER DEFAULT 0,
  d30_retained INTEGER DEFAULT 0,
  d90_retained INTEGER DEFAULT 0,
  d1_retention_rate NUMERIC(5,2) DEFAULT 0,
  d7_retention_rate NUMERIC(5,2) DEFAULT 0,
  d30_retention_rate NUMERIC(5,2) DEFAULT 0,
  d90_retention_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cohort_date)
);

-- Create vertical_metrics table for per-vertical analytics
CREATE TABLE IF NOT EXISTS public.vertical_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  vertical VARCHAR(50) NOT NULL,
  listings_count INTEGER DEFAULT 0,
  active_listings INTEGER DEFAULT 0,
  providers_count INTEGER DEFAULT 0,
  bookings_count INTEGER DEFAULT 0,
  gmv NUMERIC(12,2) DEFAULT 0,
  avg_order_value NUMERIC(12,2) DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  take_rate NUMERIC(5,2) DEFAULT 10,
  revenue NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, vertical)
);

-- Create geographic_metrics table for location-based analytics
CREATE TABLE IF NOT EXISTS public.geographic_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  location_name VARCHAR(100) NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  users_count INTEGER DEFAULT 0,
  providers_count INTEGER DEFAULT 0,
  bookings_count INTEGER DEFAULT 0,
  gmv NUMERIC(12,2) DEFAULT 0,
  avg_order_value NUMERIC(12,2) DEFAULT 0,
  top_vertical VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, location_name)
);

-- Create cross_sell_metrics table for tracking multi-vertical usage
CREATE TABLE IF NOT EXISTS public.cross_sell_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  from_vertical VARCHAR(50) NOT NULL,
  to_vertical VARCHAR(50) NOT NULL,
  users_count INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, from_vertical, to_vertical)
);

-- Enable RLS on new tables
ALTER TABLE public.cohort_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vertical_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geographic_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_sell_metrics ENABLE ROW LEVEL SECURITY;

-- Admin-only read policies
CREATE POLICY "Admins can read cohort_metrics"
  ON public.cohort_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read vertical_metrics"
  ON public.vertical_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read geographic_metrics"
  ON public.geographic_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read cross_sell_metrics"
  ON public.cross_sell_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cohort_metrics_date ON public.cohort_metrics(cohort_date);
CREATE INDEX IF NOT EXISTS idx_vertical_metrics_date ON public.vertical_metrics(date);
CREATE INDEX IF NOT EXISTS idx_vertical_metrics_vertical ON public.vertical_metrics(vertical);
CREATE INDEX IF NOT EXISTS idx_geographic_metrics_date ON public.geographic_metrics(date);
CREATE INDEX IF NOT EXISTS idx_cross_sell_metrics_date ON public.cross_sell_metrics(date);