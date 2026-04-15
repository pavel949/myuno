-- CRM MC audit: default CRM edit for non-director MC members (fixes RLS mc_can_access insert/update blocks)
-- + optional offplan link on deals
--
-- team_member_permissions may not exist on older remotes; guard with IF EXISTS.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'team_member_permissions'
  ) THEN
    INSERT INTO public.team_member_permissions (company_id, user_id, module, can_view, can_edit)
    SELECT m.company_id, m.user_id, 'crm', true, true
    FROM public.management_company_members m
    WHERE m.is_active = true
      AND m.role NOT IN ('director', 'admin')
      AND NOT EXISTS (
        SELECT 1
        FROM public.team_member_permissions t
        WHERE t.company_id = m.company_id
          AND t.user_id = m.user_id
          AND t.module = 'crm'
      );
  END IF;
END $$;

-- Link deals to developer projects (offplan / newbuild) for targeted sales reporting
ALTER TABLE public.agent_deals
  ADD COLUMN IF NOT EXISTS property_project_id uuid REFERENCES public.property_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agent_deals_property_project
  ON public.agent_deals(company_id, property_project_id)
  WHERE property_project_id IS NOT NULL;
