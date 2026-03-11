-- Ensure new CRM contacts default to lead lifecycle stage.
ALTER TABLE public.crm_contacts
ALTER COLUMN lifecycle_stage SET DEFAULT 'lead';

