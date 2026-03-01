
-- Add lifecycle_stage to crm_contacts
ALTER TABLE public.crm_contacts 
ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'lead';

-- Add comment for documentation
COMMENT ON COLUMN public.crm_contacts.lifecycle_stage IS 'Contact lifecycle: lead, mql, sql, opportunity, customer, evangelist, other';
