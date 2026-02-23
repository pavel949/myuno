
-- ============================================================
-- Phase 1: Cross-Sell offers table
-- ============================================================
CREATE TABLE public.booking_cross_sell_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.property_bookings(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  service_id UUID,
  service_name TEXT NOT NULL,
  suggested_price NUMERIC(12,2),
  discount_percent NUMERIC(5,2) DEFAULT 0,
  currency TEXT DEFAULT 'THB',
  reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested','accepted','dismissed','converted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cross_sell_booking ON public.booking_cross_sell_offers(booking_id);
CREATE INDEX idx_cross_sell_status ON public.booking_cross_sell_offers(status);

ALTER TABLE public.booking_cross_sell_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view cross-sell offers"
ON public.booking_cross_sell_offers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    JOIN public.properties p ON p.id = pb.property_id
    WHERE pb.id = booking_cross_sell_offers.booking_id AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Guest can view own cross-sell offers"
ON public.booking_cross_sell_offers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    WHERE pb.id = booking_cross_sell_offers.booking_id AND pb.guest_id = auth.uid()
  )
);

CREATE POLICY "Guest can update cross-sell status"
ON public.booking_cross_sell_offers FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    WHERE pb.id = booking_cross_sell_offers.booking_id AND pb.guest_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    WHERE pb.id = booking_cross_sell_offers.booking_id AND pb.guest_id = auth.uid()
  )
);

CREATE POLICY "Service can insert cross-sell offers"
ON public.booking_cross_sell_offers FOR INSERT TO authenticated
WITH CHECK (true);

CREATE TRIGGER update_cross_sell_updated_at
BEFORE UPDATE ON public.booking_cross_sell_offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Phase 2: Pricing recommendations table
-- ============================================================
CREATE TABLE public.pricing_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  current_price NUMERIC(12,2),
  recommended_price NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'THB',
  confidence INTEGER CHECK (confidence BETWEEN 0 AND 100),
  reasoning TEXT,
  factors JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','applied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pricing_rec_property ON public.pricing_recommendations(property_id);
CREATE INDEX idx_pricing_rec_status ON public.pricing_recommendations(status);

ALTER TABLE public.pricing_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view pricing recommendations"
ON public.pricing_recommendations FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = pricing_recommendations.property_id AND p.owner_id = auth.uid())
);

CREATE POLICY "Owner can update pricing recommendations"
ON public.pricing_recommendations FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = pricing_recommendations.property_id AND p.owner_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = pricing_recommendations.property_id AND p.owner_id = auth.uid())
);

CREATE POLICY "Service can insert pricing recommendations"
ON public.pricing_recommendations FOR INSERT TO authenticated
WITH CHECK (true);

CREATE TRIGGER update_pricing_rec_updated_at
BEFORE UPDATE ON public.pricing_recommendations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Phase 3: Property Passport tables
-- ============================================================
CREATE TABLE public.property_passport_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_ids UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_passport_events_property ON public.property_passport_events(property_id);
CREATE INDEX idx_passport_events_date ON public.property_passport_events(event_date DESC);

ALTER TABLE public.property_passport_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage passport events"
ON public.property_passport_events FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_passport_events.property_id AND p.owner_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_passport_events.property_id AND p.owner_id = auth.uid())
);

CREATE TABLE public.document_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_file_id UUID,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  document_name TEXT NOT NULL,
  expires_at DATE NOT NULL,
  reminder_days_before INTEGER[] DEFAULT '{30, 7, 1}',
  last_notified_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doc_reminders_owner ON public.document_reminders(owner_id);
CREATE INDEX idx_doc_reminders_expires ON public.document_reminders(expires_at) WHERE is_active = true;

ALTER TABLE public.document_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage document reminders"
ON public.document_reminders FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE TRIGGER update_doc_reminders_updated_at
BEFORE UPDATE ON public.document_reminders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
