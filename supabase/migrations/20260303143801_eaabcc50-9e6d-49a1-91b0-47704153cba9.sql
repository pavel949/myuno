
-- =============================================
-- MIGRATION 1: promoted_listings
-- =============================================
CREATE TABLE public.promoted_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  listing_type text NOT NULL DEFAULT 'property',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promotion_type text NOT NULL DEFAULT 'featured',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'THB',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promoted_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own promoted listings"
  ON public.promoted_listings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own promoted listings"
  ON public.promoted_listings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update promoted listings"
  ON public.promoted_listings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_promoted_listings_active 
  ON public.promoted_listings (listing_type, listing_id) 
  WHERE status = 'active';

CREATE INDEX idx_promoted_listings_user 
  ON public.promoted_listings (user_id);

-- =============================================
-- MIGRATION 2: disputes
-- =============================================
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  dispute_type text NOT NULL DEFAULT 'service_quality',
  status text NOT NULL DEFAULT 'open',
  description text NOT NULL,
  evidence_urls text[] DEFAULT '{}',
  resolution text,
  admin_notes text,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own disputes"
  ON public.disputes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create disputes"
  ON public.disputes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update disputes"
  ON public.disputes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_disputes_user ON public.disputes (user_id);
CREATE INDEX idx_disputes_status ON public.disputes (status);
CREATE INDEX idx_disputes_order ON public.disputes (order_id);

-- =============================================
-- MIGRATION 3: analytics_events
-- =============================================
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  event_name text NOT NULL,
  event_data jsonb DEFAULT '{}',
  page_path text,
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert events"
  ON public.analytics_events FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anonymous can insert events"
  ON public.analytics_events FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Admins can read analytics"
  ON public.analytics_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_analytics_events_name ON public.analytics_events (event_name, created_at);
CREATE INDEX idx_analytics_events_user ON public.analytics_events (user_id, created_at);
CREATE INDEX idx_analytics_events_created ON public.analytics_events (created_at);
