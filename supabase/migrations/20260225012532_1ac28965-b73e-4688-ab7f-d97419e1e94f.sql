
-- Unified CRM custom options per company
-- Categories: deal_stage, contact_type, lead_source, deal_type, task_type
CREATE TABLE public.crm_custom_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  category text NOT NULL, -- deal_stage | contact_type | lead_source | deal_type | task_type
  value text NOT NULL,     -- slug/key: 'new', 'contacted', 'buyer', etc.
  label_en text NOT NULL,
  label_ru text NOT NULL,
  short_en text,           -- short label for kanban headers
  short_ru text,
  color text,              -- hex color
  icon text,               -- lucide icon name or emoji
  probability numeric,     -- for deal_stage: 0.0 - 1.0
  is_system boolean NOT NULL DEFAULT false, -- system defaults can't be deleted
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique value per category per company
CREATE UNIQUE INDEX idx_crm_options_uniq ON public.crm_custom_options(company_id, category, lower(value));

-- Fast lookups by company + category
CREATE INDEX idx_crm_options_lookup ON public.crm_custom_options(company_id, category, sort_order);

ALTER TABLE public.crm_custom_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view CRM options"
  ON public.crm_custom_options FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Company members can insert CRM options"
  ON public.crm_custom_options FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Company members can update CRM options"
  ON public.crm_custom_options FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Company members can delete CRM options"
  ON public.crm_custom_options FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
  ) AND is_system = false);
