
-- Add missing PMS columns to unified properties table
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS chat_delegated_to_platform boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ical_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS ical_token_refreshed_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_report_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS report_frequency text,
  ADD COLUMN IF NOT EXISTS report_recipients text[];
