-- ====== PROPERTY BOOKINGS TABLE FOR CALENDAR ======
CREATE TABLE public.property_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_name TEXT,
  guest_phone TEXT,
  guest_email TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests_count INTEGER DEFAULT 1,
  total_amount NUMERIC,
  currency TEXT DEFAULT 'THB',
  source TEXT DEFAULT 'manual', -- manual, airbnb, booking, other
  external_id TEXT, -- ID from external platform
  status TEXT DEFAULT 'confirmed', -- pending, confirmed, cancelled, completed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for property bookings
CREATE POLICY "Owners can view own property bookings"
ON public.property_bookings FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert own property bookings"
ON public.property_bookings FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own property bookings"
ON public.property_bookings FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete own property bookings"
ON public.property_bookings FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Indexes
CREATE INDEX idx_property_bookings_property ON public.property_bookings(property_id);
CREATE INDEX idx_property_bookings_owner ON public.property_bookings(owner_id);
CREATE INDEX idx_property_bookings_dates ON public.property_bookings(check_in, check_out);

-- Trigger for updated_at
CREATE TRIGGER update_property_bookings_updated_at
  BEFORE UPDATE ON public.property_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_bookings;