
-- Add owner_contact_id FK to properties to link with CRM contacts
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS owner_contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_properties_owner_contact_id ON public.properties(owner_contact_id);

-- Add emergency_contact and special_notes fields to crm_contacts for owner account management
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact_relation text,
  ADD COLUMN IF NOT EXISTS special_notes text;
