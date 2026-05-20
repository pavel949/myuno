-- CRM contact: free-form named links (Notion docs, Drive folders, Linear tickets, etc.)
-- RLS mirrors crm_contact_notes (company-member read/write, user owns delete).

CREATE TABLE IF NOT EXISTS public.crm_contact_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  label text NOT NULL,
  url text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_contact_links_contact ON public.crm_contact_links(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_contact_links_company ON public.crm_contact_links(company_id);

ALTER TABLE public.crm_contact_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view contact links"
  ON public.crm_contact_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.crm_contacts c
      JOIN public.management_company_members mcm ON mcm.company_id = c.company_id
      WHERE c.id = crm_contact_links.contact_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can insert contact links"
  ON public.crm_contact_links FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.crm_contacts c
      JOIN public.management_company_members mcm ON mcm.company_id = c.company_id
      WHERE c.id = crm_contact_links.contact_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can update contact links"
  ON public.crm_contact_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.crm_contacts c
      JOIN public.management_company_members mcm ON mcm.company_id = c.company_id
      WHERE c.id = crm_contact_links.contact_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own links"
  ON public.crm_contact_links FOR DELETE
  USING (auth.uid() = created_by);

CREATE TRIGGER update_crm_contact_links_updated_at
  BEFORE UPDATE ON public.crm_contact_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

NOTIFY pgrst, 'reload schema';
