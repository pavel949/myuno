-- Multi-role QA access: seed orgs + optional user grants, extend mode/staff resolution.
-- Before applying locally, set v_target_email in the DO block below (or leave NULL to skip user grants).

-- 1) Allow explicit "staff" platform mode (platform staff, not MC)
ALTER TABLE public.user_active_context
  DROP CONSTRAINT IF EXISTS user_active_context_mode_check;

ALTER TABLE public.user_active_context
  ADD CONSTRAINT user_active_context_mode_check
  CHECK (mode IN ('user', 'owner', 'mc', 'investor', 'vendor', 'admin', 'team', 'staff'));

-- 2) Deterministic seed IDs (stable across environments for idempotent grants)
-- Vendor org for QA multi-role flows
-- Owner-type org (building owner persona)
-- Management company for MC / property_manager flows

-- 3) resolve_user_context: add WHEN 'staff'; treat MC owner role like admin for permissions
CREATE OR REPLACE FUNCTION public.resolve_user_context(
  p_user_id uuid,
  p_mode text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mode text;
  v_entity_id uuid;
  v_role text;
  v_permissions text[];
  v_mc_role text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot resolve context for another user';
  END IF;

  IF p_mode IS NOT NULL THEN
    v_mode := p_mode;
    v_entity_id := p_entity_id;
  ELSE
    SELECT mode, entity_id INTO v_mode, v_entity_id
    FROM user_active_context
    WHERE user_id = p_user_id;

    IF v_mode IS NULL THEN
      v_mode := 'user';
    END IF;
  END IF;

  CASE v_mode
    WHEN 'mc' THEN
      SELECT mcm.role INTO v_mc_role
      FROM management_company_members mcm
      WHERE mcm.user_id = p_user_id
        AND mcm.company_id = v_entity_id
        AND mcm.is_active = true;

      IF v_mc_role IS NULL THEN
        v_mode := 'user';
        v_role := 'user';
      ELSE
        v_role := v_mc_role;

        SELECT array_agg(DISTINCT module) INTO v_permissions
        FROM team_member_permissions
        WHERE user_id = p_user_id
          AND company_id = v_entity_id
          AND can_view = true;

        IF v_mc_role IN ('director', 'admin', 'owner') THEN
          v_permissions := ARRAY['crm', 'finance', 'bookings', 'properties', 'team', 'reports', 'settings', 'operations', 'channels', 'messages', 'inventory', 'maintenance'];
        END IF;
      END IF;

    WHEN 'owner' THEN
      v_role := 'owner';
      v_permissions := ARRAY['properties', 'finance', 'reports'];

    WHEN 'admin' THEN
      IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role IN ('admin', 'uno_team')) THEN
        v_role := 'admin';
        v_permissions := ARRAY['*'];
      ELSE
        v_mode := 'user';
        v_role := 'user';
      END IF;

    WHEN 'vendor' THEN
      v_role := 'vendor';
      v_permissions := ARRAY['services', 'bookings', 'finance'];

    WHEN 'team' THEN
      IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role IN ('uno_team', 'admin')) THEN
        v_role := 'uno_team';
        v_permissions := ARRAY['*'];
      ELSE
        v_mode := 'user';
        v_role := 'user';
      END IF;

    WHEN 'staff' THEN
      IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'staff'::public.app_role) THEN
        v_role := 'staff';
        v_permissions := ARRAY['operations', 'bookings', 'messages', 'channels'];
      ELSE
        v_mode := 'user';
        v_role := 'user';
      END IF;

    ELSE
      v_role := 'user';
      v_permissions := ARRAY[]::text[];
  END CASE;

  RETURN jsonb_build_object(
    'mode', v_mode,
    'entity_id', v_entity_id,
    'role', v_role,
    'permissions', COALESCE(v_permissions, ARRAY[]::text[]),
    'resolved_at', now()
  );
END;
$$;

-- 4) Seed orgs + MC + optional membership for one user (edit email in DO block)
DO $$
DECLARE
  -- Set to your login email before running migration, or NULL to only apply schema + seed orgs
  v_target_email text := NULL;
  v_uid uuid;
  v_vendor_org uuid := 'a0000000-0000-4000-8000-000000000001'::uuid;
  v_owner_org uuid := 'a0000000-0000-4000-8000-000000000002'::uuid;
  v_mc_id uuid := 'a0000000-0000-4000-8000-000000000003'::uuid;
BEGIN
  INSERT INTO public.orgs (id, name, name_ru, org_type, is_active, is_verified)
  VALUES
    (v_vendor_org, 'QA Multi-Role Vendor', 'QA Поставщик', 'vendor', true, true),
    (v_owner_org, 'QA Multi-Role Owner Org', 'QA Собственник', 'owner', true, true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.management_companies (
    id, slug, name_en, name_ru, is_active, is_verified
  ) VALUES (
    v_mc_id,
    'qa-multi-role-mc',
    'QA Management Company',
    'QA Управляющая компания',
    true,
    false
  )
  ON CONFLICT (id) DO NOTHING;

  IF v_target_email IS NULL OR length(trim(v_target_email)) = 0 THEN
    RAISE NOTICE 'qa_multi_role_access: v_target_email not set — skipped user_roles / memberships. See docs/QA_MULTI_ROLE_SETUP.md';
    RETURN;
  END IF;

  SELECT id INTO v_uid FROM auth.users WHERE email = lower(trim(v_target_email)) LIMIT 1;
  IF v_uid IS NULL THEN
    RAISE NOTICE 'qa_multi_role_access: no auth.users row for email % — skipped user grants', v_target_email;
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES
    (v_uid, 'admin'::public.app_role),
    (v_uid, 'uno_team'::public.app_role),
    (v_uid, 'staff'::public.app_role),
    (v_uid, 'vendor'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.org_members (org_id, user_id, role, is_active)
  VALUES
    (v_vendor_org, v_uid, 'owner', true),
    (v_owner_org, v_uid, 'owner', true)
  ON CONFLICT (org_id, user_id) DO UPDATE SET is_active = true, role = EXCLUDED.role;

  INSERT INTO public.management_company_members (company_id, user_id, role, is_active)
  VALUES (v_mc_id, v_uid, 'owner', true)
  ON CONFLICT (company_id, user_id) DO UPDATE SET is_active = true, role = EXCLUDED.role;

  RAISE NOTICE 'qa_multi_role_access: granted multi-role QA access for user %', v_uid;
END $$;

COMMENT ON FUNCTION public.resolve_user_context(uuid, text, uuid) IS
  'Resolves active context; supports modes user/owner/mc/vendor/admin/team/staff.';
