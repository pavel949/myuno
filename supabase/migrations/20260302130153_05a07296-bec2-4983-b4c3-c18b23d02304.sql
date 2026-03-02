
-- Add advanced pricing columns to properties table
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS early_booking_discount numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS early_booking_days integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_minute_discount numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_minute_days integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_policy text DEFAULT 'prepay_10',
  ADD COLUMN IF NOT EXISTS negotiation_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_length_discounts jsonb DEFAULT NULL;

-- Create property_price_offers table
CREATE TABLE IF NOT EXISTS public.property_price_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.property_bookings(id) ON DELETE SET NULL,
  guest_user_id uuid DEFAULT NULL,
  type text NOT NULL CHECK (type IN ('special_offer', 'negotiation_request', 'counter_offer')),
  original_price numeric NOT NULL,
  offered_price numeric NOT NULL,
  discount_percent numeric,
  valid_from date NOT NULL,
  valid_until date NOT NULL,
  nights integer,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'countered')),
  created_by uuid NOT NULL,
  responded_at timestamptz,
  response_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_price_offers ENABLE ROW LEVEL SECURITY;

-- RLS: Property managers can manage offers for their properties
CREATE POLICY "Managers can manage price offers" ON public.property_price_offers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_price_offers.property_id
    AND (p.owner_id = auth.uid() OR p.management_company_id IN (
      SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()
    ))
  )
);

-- RLS: Guests can view offers directed at them
CREATE POLICY "Guests can view their offers" ON public.property_price_offers
FOR SELECT USING (guest_user_id = auth.uid());

-- RLS: Guests can create negotiation requests
CREATE POLICY "Guests can create negotiation requests" ON public.property_price_offers
FOR INSERT WITH CHECK (
  created_by = auth.uid() AND type = 'negotiation_request'
);

-- RLS: Guests can update status on offers directed at them (accept/decline)
CREATE POLICY "Guests can respond to offers" ON public.property_price_offers
FOR UPDATE USING (guest_user_id = auth.uid())
WITH CHECK (guest_user_id = auth.uid());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_price_offers_property ON public.property_price_offers(property_id);
CREATE INDEX IF NOT EXISTS idx_price_offers_guest ON public.property_price_offers(guest_user_id);
CREATE INDEX IF NOT EXISTS idx_price_offers_status ON public.property_price_offers(status);
