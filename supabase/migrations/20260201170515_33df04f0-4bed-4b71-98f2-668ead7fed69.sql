-- Create calendar_sync_logs table for tracking sync history
CREATE TABLE public.calendar_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid REFERENCES public.property_external_calendars(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  synced_at timestamptz DEFAULT now(),
  events_found integer DEFAULT 0,
  events_added integer DEFAULT 0,
  events_updated integer DEFAULT 0,
  events_removed integer DEFAULT 0,
  sync_duration_ms integer,
  sync_type text DEFAULT 'manual', -- 'manual', 'scheduled', 'webhook'
  error text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for calendar_sync_logs
CREATE POLICY "Owners can view their sync logs"
ON public.calendar_sync_logs FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "System can insert sync logs"
ON public.calendar_sync_logs FOR INSERT
WITH CHECK (true);

-- Add new columns to property_bookings for conflict detection
ALTER TABLE public.property_bookings 
ADD COLUMN IF NOT EXISTS sync_priority integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS conflict_detected_at timestamptz,
ADD COLUMN IF NOT EXISTS conflict_with_booking_id uuid;

-- Add new columns to property_external_calendars for auto-sync
ALTER TABLE public.property_external_calendars
ADD COLUMN IF NOT EXISTS sync_interval_minutes integer DEFAULT 15,
ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_sync boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS channel_type text DEFAULT 'other'; -- 'airbnb', 'booking', 'vrbo', 'other'

-- Create function to detect booking conflicts for a property
CREATE OR REPLACE FUNCTION public.detect_booking_conflicts(p_property_id uuid)
RETURNS TABLE (
  booking_id_1 uuid,
  booking_id_2 uuid,
  guest_name_1 text,
  guest_name_2 text,
  source_1 text,
  source_2 text,
  check_in_1 date,
  check_out_1 date,
  check_in_2 date,
  check_out_2 date,
  overlap_days integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b1.id as booking_id_1,
    b2.id as booking_id_2,
    b1.guest_name as guest_name_1,
    b2.guest_name as guest_name_2,
    b1.source as source_1,
    b2.source as source_2,
    b1.check_in as check_in_1,
    b1.check_out as check_out_1,
    b2.check_in as check_in_2,
    b2.check_out as check_out_2,
    (LEAST(b1.check_out, b2.check_out) - GREATEST(b1.check_in, b2.check_in))::integer as overlap_days
  FROM property_bookings b1
  JOIN property_bookings b2 ON b1.property_id = b2.property_id
    AND b1.id < b2.id  -- Avoid duplicate pairs and self-join
    AND b1.check_in < b2.check_out 
    AND b2.check_in < b1.check_out
    AND b1.status != 'cancelled'
    AND b2.status != 'cancelled'
  WHERE b1.property_id = p_property_id;
END;
$$;

-- Create index for faster conflict detection
CREATE INDEX IF NOT EXISTS idx_property_bookings_dates 
ON public.property_bookings(property_id, check_in, check_out) 
WHERE status != 'cancelled';

-- Create index for sync logs queries
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_calendar 
ON public.calendar_sync_logs(calendar_id, synced_at DESC);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_owner 
ON public.calendar_sync_logs(owner_id, synced_at DESC);