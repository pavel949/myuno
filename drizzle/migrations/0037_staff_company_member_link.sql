-- Explicit directory-to-existing-membership association only. No employment,
-- Auth account, role, module permission or operating-space grant is created.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;

ALTER TABLE public.staff_members ADD CONSTRAINT staff_members_id_company_link_key UNIQUE (id, company_id);
CREATE TABLE public.staff_company_member_links (
  staff_member_id uuid PRIMARY KEY,
  company_member_id uuid NOT NULL UNIQUE,
  company_id uuid NOT NULL,
  linked_by uuid NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_account_directory_company_fk FOREIGN KEY (staff_member_id, company_id)
    REFERENCES public.staff_members(id, company_id) ON DELETE CASCADE,
  CONSTRAINT staff_account_membership_company_fk FOREIGN KEY (company_member_id, company_id)
    REFERENCES public.management_company_members(id, company_id) ON DELETE CASCADE
);
ALTER TABLE public.staff_company_member_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_company_member_links FROM PUBLIC, anon, authenticated, service_role;

-- Revoke the association on deactivation or account replacement. Reactivation
-- needs another explicit link; this never changes membership/permission grants.
CREATE FUNCTION private.invalidate_staff_account_link() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF TG_TABLE_NAME = 'management_company_members' THEN
    IF NEW.is_active IS NOT TRUE OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.company_id IS DISTINCT FROM OLD.company_id THEN
      DELETE FROM public.staff_company_member_links WHERE company_member_id = OLD.id;
    END IF;
  ELSIF TG_TABLE_NAME = 'staff_members' THEN
    IF NEW.is_active IS NOT TRUE OR NEW.company_id IS DISTINCT FROM OLD.company_id THEN
      DELETE FROM public.staff_company_member_links WHERE staff_member_id = OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.invalidate_staff_account_link() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER invalidate_directory_account_link BEFORE UPDATE OF is_active, company_id ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION private.invalidate_staff_account_link();
CREATE TRIGGER invalidate_membership_directory_link BEFORE UPDATE OF is_active, user_id, company_id ON public.management_company_members
  FOR EACH ROW EXECUTE FUNCTION private.invalidate_staff_account_link();

CREATE FUNCTION public.get_staff_account_setup_checked(p_company_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF auth.uid() IS NULL OR p_company_id IS NULL
     OR NOT EXISTS (SELECT 1 FROM public.management_companies WHERE id = p_company_id)
     OR NOT public.actor_is_operating_company_overseer(p_company_id) THEN
    RAISE EXCEPTION 'Staff account setup forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN jsonb_build_object(
    'members', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', m.id, 'user_id', m.user_id,
      'name', COALESCE(NULLIF(btrim(p.full_name), ''), NULLIF(btrim(p.email), ''), m.user_id::text),
      'email', NULLIF(btrim(p.email), '')
    ) ORDER BY m.id) FROM public.management_company_members m LEFT JOIN public.profiles p ON p.id = m.user_id
      WHERE m.company_id = p_company_id AND m.is_active IS TRUE), '[]'::jsonb),
    'links', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'staff_member_id', l.staff_member_id, 'company_member_id', l.company_member_id, 'user_id', m.user_id
    ) ORDER BY l.staff_member_id) FROM public.staff_company_member_links l
      JOIN public.staff_members s ON s.id = l.staff_member_id AND s.company_id = l.company_id AND s.is_active IS TRUE
      JOIN public.management_company_members m ON m.id = l.company_member_id AND m.company_id = l.company_id AND m.is_active IS TRUE
      WHERE l.company_id = p_company_id), '[]'::jsonb)
  );
END;
$$;

CREATE FUNCTION public.set_staff_account_link_checked(p_company_id uuid, p_staff_member_id uuid, p_company_member_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE staff_active boolean; target_user uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Staff account setup forbidden' USING ERRCODE = '42501'; END IF;
  -- Serialize setup commands for this company, then recheck protected authority.
  PERFORM 1 FROM public.management_companies WHERE id = p_company_id FOR UPDATE;
  IF NOT FOUND OR NOT public.actor_is_operating_company_overseer(p_company_id) THEN
    RAISE EXCEPTION 'Staff account setup forbidden' USING ERRCODE = '42501';
  END IF;
  -- Hold an actor membership lock so concurrent revocation cannot complete first.
  PERFORM 1 FROM public.management_company_members WHERE company_id = p_company_id
    AND user_id = auth.uid() AND is_active IS TRUE AND role IN ('director','admin') FOR SHARE;
  PERFORM 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' FOR SHARE;
  IF NOT public.actor_is_operating_company_overseer(p_company_id) THEN
    RAISE EXCEPTION 'Staff account setup forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT is_active INTO staff_active FROM public.staff_members
    WHERE id = p_staff_member_id AND company_id = p_company_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Directory record unavailable' USING ERRCODE = '42501'; END IF;
  IF p_company_member_id IS NULL THEN
    DELETE FROM public.staff_company_member_links WHERE staff_member_id = p_staff_member_id AND company_id = p_company_id;
    RETURN jsonb_build_object('staff_member_id', p_staff_member_id, 'company_member_id', NULL, 'user_id', NULL);
  END IF;
  IF staff_active IS NOT TRUE THEN RAISE EXCEPTION 'Directory record inactive' USING ERRCODE = '42501'; END IF;
  SELECT user_id INTO target_user FROM public.management_company_members WHERE id = p_company_member_id
    AND company_id = p_company_id AND is_active IS TRUE FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active company membership required' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.staff_company_member_links(staff_member_id, company_member_id, company_id, linked_by)
    VALUES (p_staff_member_id, p_company_member_id, p_company_id, auth.uid())
    ON CONFLICT (staff_member_id) DO UPDATE SET company_member_id = EXCLUDED.company_member_id,
      linked_by = EXCLUDED.linked_by, linked_at = now();
  RETURN jsonb_build_object('staff_member_id', p_staff_member_id, 'company_member_id', p_company_member_id, 'user_id', target_user);
END;
$$;
REVOKE ALL ON FUNCTION public.get_staff_account_setup_checked(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.set_staff_account_link_checked(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_staff_account_setup_checked(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_staff_account_link_checked(uuid, uuid, uuid) TO authenticated;
COMMIT;
