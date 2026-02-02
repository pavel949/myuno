-- ============================================
-- YACHT CALENDAR & CANCELLATION POLICY SYSTEM
-- Phase 1: Foundation for yacht charter management
-- ============================================

-- Add cancellation_policy column to yachts table
ALTER TABLE public.yachts 
ADD COLUMN IF NOT EXISTS cancellation_policy text DEFAULT 'moderate';

-- Add deposit configuration columns
ALTER TABLE public.yachts 
ADD COLUMN IF NOT EXISTS deposit_percent integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS balance_due_hours integer DEFAULT 48;

-- Add iCal sync support
ALTER TABLE public.yachts 
ADD COLUMN IF NOT EXISTS ical_token text UNIQUE,
ADD COLUMN IF NOT EXISTS ical_token_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ical_token_refreshed_at timestamp with time zone;

-- Create yacht_availability table for blackout dates and price overrides
CREATE TABLE IF NOT EXISTS public.yacht_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_id uuid NOT NULL REFERENCES public.yachts(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'blocked', 'booked', 'maintenance')),
  price_override numeric,
  note text,
  booking_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(yacht_id, date)
);

-- Enable RLS on yacht_availability
ALTER TABLE public.yacht_availability ENABLE ROW LEVEL SECURITY;

-- Policies for yacht_availability
-- Yacht owners can manage their availability
CREATE POLICY "Yacht owners can view own availability"
ON public.yacht_availability
FOR SELECT
USING (
  yacht_id IN (
    SELECT y.id FROM public.yachts y
    JOIN public.providers p ON y.provider_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Yacht owners can insert own availability"
ON public.yacht_availability
FOR INSERT
WITH CHECK (
  yacht_id IN (
    SELECT y.id FROM public.yachts y
    JOIN public.providers p ON y.provider_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Yacht owners can update own availability"
ON public.yacht_availability
FOR UPDATE
USING (
  yacht_id IN (
    SELECT y.id FROM public.yachts y
    JOIN public.providers p ON y.provider_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Yacht owners can delete own availability"
ON public.yacht_availability
FOR DELETE
USING (
  yacht_id IN (
    SELECT y.id FROM public.yachts y
    JOIN public.providers p ON y.provider_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Admins can manage all yacht availability
CREATE POLICY "Admins can manage all yacht availability"
ON public.yacht_availability
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Public can view availability for active yachts
CREATE POLICY "Public can view yacht availability"
ON public.yacht_availability
FOR SELECT
USING (
  yacht_id IN (
    SELECT id FROM public.yachts WHERE is_active = true
  )
);

-- Create cancellation_policies reference table
CREATE TABLE IF NOT EXISTS public.cancellation_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ru text NOT NULL,
  description_en text,
  description_ru text,
  full_refund_hours integer DEFAULT 168, -- 7 days
  partial_refund_hours integer DEFAULT 48, -- 2 days
  partial_refund_percent integer DEFAULT 50,
  no_refund_hours integer DEFAULT 24, -- 1 day
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default cancellation policies
INSERT INTO public.cancellation_policies (code, name_en, name_ru, description_en, description_ru, full_refund_hours, partial_refund_hours, partial_refund_percent, no_refund_hours, sort_order)
VALUES 
  ('flexible', 'Flexible', 'Гибкая', 
   'Full refund up to 24 hours before, 50% up to 2 hours before', 
   'Полный возврат за 24 часа, 50% за 2 часа до', 
   24, 2, 50, 0, 1),
  ('moderate', 'Moderate', 'Умеренная', 
   'Full refund up to 5 days before, 50% up to 48 hours before', 
   'Полный возврат за 5 дней, 50% за 48 часов до', 
   120, 48, 50, 24, 2),
  ('strict', 'Strict', 'Строгая', 
   'Full refund up to 7 days before, 50% up to 3 days before', 
   'Полный возврат за 7 дней, 50% за 3 дня до', 
   168, 72, 50, 48, 3),
  ('super_strict', 'Super Strict', 'Очень строгая', 
   'Full refund only 14+ days before, no refund after', 
   'Полный возврат только за 14+ дней, после без возврата', 
   336, 168, 25, 72, 4)
ON CONFLICT (code) DO NOTHING;

-- Enable RLS on cancellation_policies
ALTER TABLE public.cancellation_policies ENABLE ROW LEVEL SECURITY;

-- Everyone can read cancellation policies
CREATE POLICY "Anyone can view cancellation policies"
ON public.cancellation_policies
FOR SELECT
USING (true);

-- Only admins can modify cancellation policies
CREATE POLICY "Admins can manage cancellation policies"
ON public.cancellation_policies
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_yacht_availability_yacht_id ON public.yacht_availability(yacht_id);
CREATE INDEX IF NOT EXISTS idx_yacht_availability_date ON public.yacht_availability(date);
CREATE INDEX IF NOT EXISTS idx_yacht_availability_status ON public.yacht_availability(status);
CREATE INDEX IF NOT EXISTS idx_yachts_cancellation_policy ON public.yachts(cancellation_policy);

-- Function to check yacht availability for a date range
CREATE OR REPLACE FUNCTION public.check_yacht_availability(
  p_yacht_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  blocked_count integer;
BEGIN
  -- Check for any blocked or booked dates in range
  SELECT COUNT(*) INTO blocked_count
  FROM yacht_availability
  WHERE yacht_id = p_yacht_id
    AND date >= p_start_date
    AND date < p_end_date
    AND status IN ('blocked', 'booked', 'maintenance');
  
  RETURN blocked_count = 0;
END;
$$;

-- Function to get yacht availability for a month
CREATE OR REPLACE FUNCTION public.get_yacht_availability(
  p_yacht_id uuid,
  p_month date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date date,
  status text,
  price_override numeric,
  note text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ya.date,
    ya.status,
    ya.price_override,
    ya.note
  FROM yacht_availability ya
  WHERE ya.yacht_id = p_yacht_id
    AND ya.date >= date_trunc('month', p_month)::date
    AND ya.date < (date_trunc('month', p_month) + interval '1 month')::date
  ORDER BY ya.date;
END;
$$;

-- Trigger to update updated_at on yacht_availability
CREATE OR REPLACE FUNCTION public.update_yacht_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_yacht_availability_updated_at
BEFORE UPDATE ON public.yacht_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_yacht_availability_updated_at();