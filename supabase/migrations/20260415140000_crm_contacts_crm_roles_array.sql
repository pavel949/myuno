-- CRM contacts: multiple roles (crm_roles text[]) — replaces legacy crm_role text
-- Fixes PGRST204 when crm_role was never applied; supports investor+owner+tourist+resident+developer+buyer.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crm_contacts' AND column_name = 'crm_roles'
  ) THEN
    ALTER TABLE public.crm_contacts
    ADD COLUMN crm_roles text[] NOT NULL DEFAULT '{}';
  ELSE
    UPDATE public.crm_contacts SET crm_roles = '{}' WHERE crm_roles IS NULL;
    ALTER TABLE public.crm_contacts ALTER COLUMN crm_roles SET DEFAULT '{}';
    ALTER TABLE public.crm_contacts ALTER COLUMN crm_roles SET NOT NULL;
  END IF;
END $$;

-- Migrate from legacy single column if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crm_contacts' AND column_name = 'crm_role'
  ) THEN
    UPDATE public.crm_contacts
    SET crm_roles = CASE
      WHEN crm_role IS NULL OR btrim(crm_role::text) = '' THEN '{}'::text[]
      WHEN crm_role IN (
        'owner', 'tenant', 'investor', 'prospect', 'partner', 'agent', 'other',
        'tourist', 'resident', 'developer', 'buyer'
      ) THEN ARRAY[crm_role]::text[]
      ELSE ARRAY['other']::text[]
    END;

    ALTER TABLE public.crm_contacts DROP COLUMN crm_role;
  END IF;
END $$;

ALTER TABLE public.crm_contacts DROP CONSTRAINT IF EXISTS crm_contacts_crm_roles_valid;

ALTER TABLE public.crm_contacts ADD CONSTRAINT crm_contacts_crm_roles_valid CHECK (
  crm_roles <@ ARRAY[
    'owner', 'tenant', 'investor', 'prospect', 'partner', 'agent', 'other',
    'tourist', 'resident', 'developer', 'buyer'
  ]::text[]
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_crm_roles ON public.crm_contacts USING GIN (crm_roles);

COMMENT ON COLUMN public.crm_contacts.crm_roles IS 'CRM persona roles (multi-select): owner, investor, tourist, resident, developer, buyer, etc.';
