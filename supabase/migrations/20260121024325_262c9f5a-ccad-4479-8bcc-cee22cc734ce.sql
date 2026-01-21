-- Create UNO Team permissions table
CREATE TABLE IF NOT EXISTS public.uno_team_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vertical text NOT NULL,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_submit_for_review boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, vertical)
);

COMMENT ON TABLE public.uno_team_permissions IS 'Granular permissions for UNO Team members per vertical';

ALTER TABLE public.uno_team_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_permissions" ON public.uno_team_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "uno_team_view_own_permissions" ON public.uno_team_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'uno_team'));

CREATE TRIGGER update_uno_team_permissions_updated_at
  BEFORE UPDATE ON public.uno_team_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.uno_team_can(
  _user_id uuid,
  _vertical text,
  _action text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.uno_team_permissions
    WHERE user_id = _user_id
      AND vertical = _vertical
      AND CASE _action
        WHEN 'create' THEN can_create
        WHEN 'edit' THEN can_edit
        WHEN 'delete' THEN can_delete
        WHEN 'submit' THEN can_submit_for_review
        ELSE false
      END
  )
$$;