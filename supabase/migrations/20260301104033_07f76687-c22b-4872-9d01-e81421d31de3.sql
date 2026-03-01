
-- Table for company-specific category enable/disable settings
CREATE TABLE public.company_category_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  category_type text NOT NULL CHECK (category_type IN ('expense', 'income')),
  category_code text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, category_type, category_code)
);

ALTER TABLE public.company_category_settings ENABLE ROW LEVEL SECURITY;

-- Read: any member of the company
CREATE POLICY "Members can view category settings"
ON public.company_category_settings
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  )
);

-- Insert/Update/Delete: director, manager, accountant only
CREATE POLICY "Managers can manage category settings"
ON public.company_category_settings
FOR ALL
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
