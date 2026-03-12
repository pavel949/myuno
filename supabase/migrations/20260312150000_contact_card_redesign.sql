-- Contact Card Redesign — CRM Module
-- Adds: role, contact_relationships, key_dates, crm_reminders
-- Aligns with Ignatev Estate / myUNO CRM requirements

-- 1. Add role column to crm_contacts (Owner, Tenant, Investor, etc.)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crm_contacts' AND column_name = 'crm_role'
  ) THEN
    ALTER TABLE public.crm_contacts
    ADD COLUMN crm_role text CHECK (crm_role IN (
      'owner', 'tenant', 'investor', 'prospect', 'partner', 'agent', 'other'
    ));
  END IF;
END $$;

-- 2. Add key_dates JSONB (e.g. lease start, visa expiry)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crm_contacts' AND column_name = 'key_dates'
  ) THEN
    ALTER TABLE public.crm_contacts
    ADD COLUMN key_dates jsonb DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN public.crm_contacts.key_dates IS 'Array of {label: string, date: date}';
  END IF;
END $$;

-- 3. Add preferred_language (alias for language; keep for clarity)
-- language already exists; no change needed

-- 4. contact_relationships — contact ↔ contact (spouse, partner, referred by, etc.)
CREATE TABLE IF NOT EXISTS public.contact_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  related_contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN (
    'spouse', 'partner', 'friend', 'colleague', 'referred_by', 'family', 'other'
  )),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT contact_relationships_no_self CHECK (contact_id != related_contact_id),
  CONSTRAINT contact_relationships_unique UNIQUE (contact_id, related_contact_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_relationships_contact ON public.contact_relationships(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_relationships_related ON public.contact_relationships(related_contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_relationships_company ON public.contact_relationships(company_id);

ALTER TABLE public.contact_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_relationships_select" ON public.contact_relationships
  FOR SELECT TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'view'));

CREATE POLICY "contact_relationships_insert" ON public.contact_relationships
  FOR INSERT TO authenticated
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

CREATE POLICY "contact_relationships_update" ON public.contact_relationships
  FOR UPDATE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

CREATE POLICY "contact_relationships_delete" ON public.contact_relationships
  FOR DELETE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

-- 5. crm_reminders — reminders tied to contact or date
CREATE TABLE IF NOT EXISTS public.crm_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  reminder_at timestamptz NOT NULL,
  note text,
  is_repeating boolean DEFAULT false,
  repeat_rule text, -- e.g. 'weekly', 'monthly', 'yearly'
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  is_dismissed boolean DEFAULT false,
  dismissed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_crm_reminders_contact ON public.crm_reminders(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_reminders_at ON public.crm_reminders(reminder_at) WHERE NOT is_dismissed;
CREATE INDEX IF NOT EXISTS idx_crm_reminders_company ON public.crm_reminders(company_id);

ALTER TABLE public.crm_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_reminders_select" ON public.crm_reminders
  FOR SELECT TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'view'));

CREATE POLICY "crm_reminders_insert" ON public.crm_reminders
  FOR INSERT TO authenticated
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

CREATE POLICY "crm_reminders_update" ON public.crm_reminders
  FOR UPDATE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

CREATE POLICY "crm_reminders_delete" ON public.crm_reminders
  FOR DELETE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));
