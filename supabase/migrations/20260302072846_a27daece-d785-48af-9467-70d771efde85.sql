-- Fix admin property deletion: preserve activity logs without FK conflicts during cascade
-- property_activity_log stores historical events, so property_id must not require existing parent row.
ALTER TABLE public.property_activity_log
DROP CONSTRAINT IF EXISTS property_activity_log_property_id_fkey;

-- Keep query performance for audit trail lookups
CREATE INDEX IF NOT EXISTS idx_property_activity_log_property_id
ON public.property_activity_log(property_id);