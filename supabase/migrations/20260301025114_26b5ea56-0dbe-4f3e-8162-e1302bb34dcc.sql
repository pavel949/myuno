
-- Add linked_user_id to crm_contacts for linking CRM owner to auth user
ALTER TABLE public.crm_contacts 
ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_linked_user_id 
ON public.crm_contacts(linked_user_id) WHERE linked_user_id IS NOT NULL;
