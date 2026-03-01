
-- Custom financial categories per management company
CREATE TABLE public.financial_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  category_type text NOT NULL CHECK (category_type IN ('expense', 'income')),
  code text NOT NULL,
  name_en text NOT NULL,
  name_ru text NOT NULL,
  icon text,
  color text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE(company_id, category_type, code)
);

ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

-- Members of the company can read categories
CREATE POLICY "MC members can read own categories"
  ON public.financial_categories FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT mcm.company_id FROM public.management_company_members mcm
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );

-- Directors and managers can manage categories
CREATE POLICY "MC directors/managers can manage categories"
  ON public.financial_categories FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT mcm.company_id FROM public.management_company_members mcm
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
        AND mcm.role IN ('director', 'manager', 'accountant')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT mcm.company_id FROM public.management_company_members mcm
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
        AND mcm.role IN ('director', 'manager', 'accountant')
    )
  );
