
-- Add personal & professional fields to crm_contacts
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS family_info text,
  ADD COLUMN IF NOT EXISTS interests text[],
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS scoring integer DEFAULT 0;

COMMENT ON COLUMN public.crm_contacts.birthday IS 'Client birthday for personal touch';
COMMENT ON COLUMN public.crm_contacts.family_info IS 'Family details: spouse, children, etc.';
COMMENT ON COLUMN public.crm_contacts.interests IS 'Hobbies and interests array';
COMMENT ON COLUMN public.crm_contacts.job_title IS 'Position / job title';
COMMENT ON COLUMN public.crm_contacts.scoring IS 'Client scoring / priority rating 0-100';
