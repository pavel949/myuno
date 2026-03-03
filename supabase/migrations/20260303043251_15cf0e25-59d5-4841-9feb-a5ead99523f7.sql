
-- Add discount fields to property_rate_seasons for per-season pricing rules
ALTER TABLE public.property_rate_seasons 
  ADD COLUMN IF NOT EXISTS early_booking_discount numeric,
  ADD COLUMN IF NOT EXISTS early_booking_days integer,
  ADD COLUMN IF NOT EXISTS last_minute_discount numeric,
  ADD COLUMN IF NOT EXISTS last_minute_days integer,
  ADD COLUMN IF NOT EXISTS weekly_discount integer,
  ADD COLUMN IF NOT EXISTS monthly_discount integer;
