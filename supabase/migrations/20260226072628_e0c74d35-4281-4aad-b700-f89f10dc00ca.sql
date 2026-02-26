
-- Create team_member_permissions table
CREATE TABLE public.team_member_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  module text NOT NULL,
  can_view boolean NOT NULL DEFAULT true,
  can_edit boolean NOT NULL DEFAULT false,
  granted_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id, module)
);

-- Enable RLS
ALTER TABLE public.team_member_permissions ENABLE ROW LEVEL SECURITY;

-- Security definer function: check if user is director/admin in a company
CREATE OR REPLACE FUNCTION public.is_mc_admin(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.management_company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role IN ('director', 'admin')
      AND is_active = true
  )
$$;

-- Directors/admins can manage permissions for their company
CREATE POLICY "MC admins can manage permissions"
ON public.team_member_permissions
FOR ALL
TO authenticated
USING (public.is_mc_admin(auth.uid(), company_id))
WITH CHECK (public.is_mc_admin(auth.uid(), company_id));

-- Members can read their own permissions
CREATE POLICY "Members can read own permissions"
ON public.team_member_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_team_member_permissions_user ON public.team_member_permissions(user_id, company_id);
