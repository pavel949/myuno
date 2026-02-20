
-- CRM Contacts table
CREATE TABLE public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  phone text,
  phone2 text,
  email text,
  whatsapp text,
  telegram text,
  line_id text,
  nationality text,
  language text DEFAULT 'en',
  source text,
  contact_type text DEFAULT 'buyer',
  company_name text,
  budget_min numeric,
  budget_max numeric,
  currency text DEFAULT 'THB',
  preferred_districts text[],
  preferred_types text[],
  bedrooms_min integer,
  notes text,
  tags text[] DEFAULT '{}',
  avatar_url text,
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: one phone per company
CREATE UNIQUE INDEX idx_crm_contacts_company_phone ON public.crm_contacts(company_id, phone) WHERE phone IS NOT NULL AND phone != '';

-- Indexes
CREATE INDEX idx_crm_contacts_company ON public.crm_contacts(company_id);
CREATE INDEX idx_crm_contacts_search ON public.crm_contacts USING gin (
  to_tsvector('simple', coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(phone,'') || ' ' || coalesce(email,''))
);

-- Enable RLS
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

-- RLS: members of the management company can access contacts
CREATE POLICY "Company members can view contacts"
  ON public.crm_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_contacts.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can insert contacts"
  ON public.crm_contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_contacts.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can update contacts"
  ON public.crm_contacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_contacts.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can delete contacts"
  ON public.crm_contacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_contacts.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('owner', 'admin')
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- CRM Contact Notes table
CREATE TABLE public.crm_contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  note_type text NOT NULL DEFAULT 'note',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_contact_notes_contact ON public.crm_contact_notes(contact_id);

ALTER TABLE public.crm_contact_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view contact notes"
  ON public.crm_contact_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.crm_contacts c
      JOIN public.management_company_members mcm ON mcm.company_id = c.company_id
      WHERE c.id = crm_contact_notes.contact_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can insert contact notes"
  ON public.crm_contact_notes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.crm_contacts c
      JOIN public.management_company_members mcm ON mcm.company_id = c.company_id
      WHERE c.id = crm_contact_notes.contact_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own notes"
  ON public.crm_contact_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Add contact_id to agent_deals
ALTER TABLE public.agent_deals ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.crm_contacts(id);
CREATE INDEX IF NOT EXISTS idx_agent_deals_contact ON public.agent_deals(contact_id);
