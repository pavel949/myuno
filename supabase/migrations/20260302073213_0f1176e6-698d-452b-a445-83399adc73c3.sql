
-- Add soft delete columns to properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid DEFAULT NULL;

-- Index for fast trash queries
CREATE INDEX IF NOT EXISTS idx_properties_deleted_at 
  ON public.properties(deleted_at) WHERE deleted_at IS NOT NULL;
