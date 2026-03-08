-- One active enrollment per (contact_id, sequence_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_sequence_enrollment
ON public.crm_sequence_enrollments (contact_id, sequence_id)
WHERE (status IS NULL OR status NOT IN ('completed', 'unsubscribed'));
