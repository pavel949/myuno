
-- Custom tags for CRM contacts (Odoo-style, per company)
CREATE TABLE public.contact_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_contact_tags_company_name ON public.contact_tags(company_id, lower(name));

ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view tags"
  ON public.contact_tags FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Company members can create tags"
  ON public.contact_tags FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Company members can update tags"
  ON public.contact_tags FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Company members can delete tags"
  ON public.contact_tags FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
    )
  );
