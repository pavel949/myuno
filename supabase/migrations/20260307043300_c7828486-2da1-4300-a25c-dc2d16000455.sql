
-- Add sync mode to properties for Source of Truth designation
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS sync_mode text NOT NULL DEFAULT 'import_only'
    CHECK (sync_mode IN ('import_only', 'myuno_master', 'external_master')),
  ADD COLUMN IF NOT EXISTS rentals_united_id text,
  ADD COLUMN IF NOT EXISTS last_push_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS push_sync_error text;

-- Index for quick lookup of properties in push mode
CREATE INDEX IF NOT EXISTS idx_properties_sync_mode ON public.properties(sync_mode) WHERE sync_mode = 'myuno_master';

COMMENT ON COLUMN public.properties.sync_mode IS 'import_only: only pull from OTAs; myuno_master: myUNO is source of truth, push to OTAs; external_master: OTA is master';
COMMENT ON COLUMN public.properties.rentals_united_id IS 'External property ID in Rentals United for 2-way sync';
