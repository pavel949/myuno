-- Table for external calendar subscriptions (import from OTA)
CREATE TABLE public.property_external_calendars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL, -- e.g., "Airbnb", "Booking.com"
  ical_url TEXT NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add source field to property_bookings to track where booking came from
ALTER TABLE public.property_bookings 
ADD COLUMN IF NOT EXISTS source_calendar_id UUID REFERENCES public.property_external_calendars(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.property_external_calendars ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Owners can view their own external calendars"
ON public.property_external_calendars
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create external calendars"
ON public.property_external_calendars
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own external calendars"
ON public.property_external_calendars
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own external calendars"
ON public.property_external_calendars
FOR DELETE
USING (auth.uid() = owner_id);

-- Add unique token for iCal export URL (security)
ALTER TABLE public.owner_properties 
ADD COLUMN IF NOT EXISTS ical_token UUID DEFAULT gen_random_uuid();

-- Create index for faster lookups
CREATE INDEX idx_external_calendars_property ON public.property_external_calendars(property_id);
CREATE INDEX idx_properties_ical_token ON public.owner_properties(ical_token);