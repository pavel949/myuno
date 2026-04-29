CREATE TABLE IF NOT EXISTS public.mcc_ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_type TEXT NOT NULL,
  target_entity TEXT,
  what_happened TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  what_to_do TEXT NOT NULL,
  expected_impact TEXT,
  confidence NUMERIC NOT NULL DEFAULT 0.7,
  data_points JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMPTZ,
  applied_by UUID,
  dismissed_at TIMESTAMPTZ,
  dismissed_reason TEXT,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mcc_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  executions_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mcc_channel_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  source TEXT,
  campaign_id UUID,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  ctr DECIMAL(5,4),
  cvr DECIMAL(5,4),
  cpc DECIMAL(10,2),
  cpl DECIMAL(10,2),
  cac DECIMAL(10,2),
  roas DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mcc_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID,
  creative_type TEXT NOT NULL,
  name TEXT NOT NULL,
  content JSONB NOT NULL,
  language TEXT DEFAULT 'en',
  variant_name TEXT,
  is_control BOOLEAN DEFAULT false,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  performance JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mcc_state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  trigger_event TEXT,
  trigger_event_id UUID,
  landing_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  cover_image TEXT,
  location TEXT,
  event_url TEXT,
  category TEXT NOT NULL DEFAULT 'social',
  event_date DATE NOT NULL,
  event_time TIME,
  end_date DATE,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS public.platform_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_providers INTEGER DEFAULT 0,
  active_providers INTEGER DEFAULT 0,
  new_providers INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  new_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  gmv NUMERIC(12,2) DEFAULT 0,
  platform_revenue NUMERIC(12,2) DEFAULT 0,
  subscription_revenue NUMERIC(12,2) DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  summary_en TEXT,
  summary_ru TEXT,
  cover_image TEXT,
  source_url TEXT,
  source_name TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS public.platform_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  icon TEXT,
  action_url TEXT,
  action_label_en TEXT,
  action_label_ru TEXT,
  target_roles TEXT[] DEFAULT '{owner}',
  category TEXT NOT NULL DEFAULT 'tip',
  priority INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.capital_intro_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  guest_email TEXT,
  guest_phone TEXT,
  guest_name TEXT,
  request_type TEXT NOT NULL,
  listing_id UUID,
  project_id UUID,
  asset_class TEXT,
  capital_range_thb TEXT,
  timeline TEXT,
  background TEXT,
  message TEXT,
  estimated_deal_size_thb NUMERIC,
  success_probability_pct INT,
  crm_contact_id UUID,
  crm_deal_id UUID,
  status TEXT NOT NULL DEFAULT 'new',
  source_route TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  preferred_language TEXT DEFAULT 'en',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.owner_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL UNIQUE,
  avg_rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancellation_rate NUMERIC DEFAULT 0,
  avg_response_time_minutes INTEGER,
  response_rate NUMERIC DEFAULT 0,
  review_reply_rate NUMERIC DEFAULT 0,
  is_superhost BOOLEAN DEFAULT false,
  superhost_since TIMESTAMP WITH TIME ZONE,
  last_evaluated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.owner_vault_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  property_id UUID,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  doc_type TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  tags TEXT[],
  share_token UUID,
  share_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendor_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  date DATE NOT NULL,
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  commission NUMERIC DEFAULT 0,
  net_revenue NUMERIC DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  avg_rating NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  doc_type text DEFAULT 'other',
  title text,
  file_url text,
  file_name text,
  expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendor_location_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL,
  service_id UUID NOT NULL,
  price_override NUMERIC,
  currency_override TEXT,
  duration_override INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  doc_type text DEFAULT 'other',
  title text,
  file_url text,
  file_name text,
  expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  phone TEXT,
  photo TEXT,
  bio TEXT,
  service_types TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{en}',
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  working_hours JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_property_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL,
  property_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  role_at_property text,
  is_primary boolean NOT NULL DEFAULT false,
  assigned_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  badges TEXT[] DEFAULT '{}',
  weekly_points INTEGER DEFAULT 0,
  monthly_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mcc_ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_channel_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_state_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capital_intro_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_vault_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_location_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_property_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_gamification ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'mcc_ai_recommendations','mcc_automation_rules','mcc_channel_metrics','mcc_creatives','mcc_state_history',
    'platform_events','platform_metrics','platform_news','platform_recommendations',
    'capital_intro_requests','owner_performance_metrics','owner_vault_files',
    'vendor_analytics','vendor_documents','vendor_location_services',
    'staff_documents','staff_profiles','staff_property_assignments','team_gamification'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_all', t);
    EXECUTE format($p$CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role))$p$, t || '_admin_all', t);
  END LOOP;
END $$;