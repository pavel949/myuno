-- CRM contact: VIP flag + marital status (family position)

ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS is_vip boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crm_contacts' AND column_name = 'marital_status'
  ) THEN
    ALTER TABLE public.crm_contacts
    ADD COLUMN marital_status text CHECK (marital_status IS NULL OR marital_status IN (
      'single', 'married', 'partner', 'divorced', 'widowed', 'prefer_not_say'
    ));
  END IF;
END $$;

COMMENT ON COLUMN public.crm_contacts.is_vip IS 'VIP client flag (can mirror tags)';
COMMENT ON COLUMN public.crm_contacts.marital_status IS 'Marital / relationship status';
