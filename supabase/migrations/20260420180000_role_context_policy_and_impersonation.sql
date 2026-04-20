-- Role context policy, explicit grants, platform impersonation audit, and stricter resolve_user_context.

-- 1) Policy: which modes are self-service vs require platform role / explicit grant
CREATE TABLE IF NOT EXISTS public.role_context_policy (
  mode text PRIMARY KEY,
  self_activatable boolean NOT NULL DEFAULT false,
  requires_admin_assignment boolean NOT NULL DEFAULT false,
  description text
);

COMMENT ON TABLE public.role_context_policy IS
  'Defines how users may enter user_active_context.mode: self_activatable (membership-based), requires_admin_assignment (user_roles or user_context_switch_grants).';

INSERT INTO public.role_context_policy (mode, self_activatable, requires_admin_assignment, description) VALUES
  ('user', true, false, 'Default browse mode'),
  ('owner', true, false, 'Building owner org membership'),
  ('mc', true, false, 'Management company membership'),
  ('vendor', true, false, 'Vendor org membership'),
  ('investor', false, true, 'Platform investor role or grant'),
  ('admin', false, true, 'Platform admin / uno_team'),
  ('team', false, true, 'Platform uno_team / admin'),
  ('staff', false, true, 'Platform staff role')
ON CONFLICT (mode) DO UPDATE SET
  self_activatable = EXCLUDED.self_activatable,
  requires_admin_assignment = EXCLUDED.requires_admin_assignment,
  description = EXCLUDED.description;

ALTER TABLE public.role_context_policy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_context_policy_select_authenticated"
  ON public.role_context_policy FOR SELECT
  TO authenticated
  USING (true);

-- 2) Explicit grants when admin assigns context outside normal membership
CREATE TABLE IF NOT EXISTS public.user_context_switch_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL,
  entity_id uuid,
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mode, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_user_context_switch_grants_user ON public.user_context_switch_grants(user_id);

COMMENT ON TABLE public.user_context_switch_grants IS
  'Optional allowlist rows: user may switch to mode/entity when policy or admin requires an explicit grant.';

ALTER TABLE public.user_context_switch_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_context_switch_grants_own_select"
  ON public.user_context_switch_grants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_context_switch_grants_admin_all"
  ON public.user_context_switch_grants FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Audit log for admin "view as" / platform impersonation UX (does not change auth.uid)
CREATE TABLE IF NOT EXISTS public.platform_impersonation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('enter', 'exit')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_impersonation_log_actor ON public.platform_impersonation_log(actor_id, created_at DESC);

COMMENT ON TABLE public.platform_impersonation_log IS
  'Audit trail when an admin starts/ends a platform view-as session (client UX; does not swap JWT).';

ALTER TABLE public.platform_impersonation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_impersonation_log_admin_insert"
  ON public.platform_impersonation_log FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "platform_impersonation_log_admin_select"
  ON public.platform_impersonation_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4) Helpers
CREATE OR REPLACE FUNCTION public.has_context_switch_grant(
  p_user_id uuid,
  p_mode text,
  p_entity_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_context_switch_grants g
    WHERE g.user_id = p_user_id
      AND g.mode = p_mode
      AND (g.entity_id IS NULL OR g.entity_id IS NOT DISTINCT FROM p_entity_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_vendor_membership(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members om
    INNER JOIN public.orgs o ON o.id = om.org_id AND o.org_type = 'vendor'
    WHERE om.user_id = p_user_id AND om.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_owner_org_membership(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members om
    INNER JOIN public.orgs o ON o.id = om.org_id AND o.org_type = 'owner'
    WHERE om.user_id = p_user_id AND om.is_active = true
  );
$$;

-- 5) Replace resolve_user_context with validation + investor branch + vendor/owner membership checks
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
  v_policy record;
  v_allowed boolean;
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

  -- Validate requested mode against policy + membership / roles / grants
  SELECT * INTO v_policy FROM public.role_context_policy WHERE mode = v_mode;
  v_allowed := true;

  IF v_policy IS NULL AND v_mode IS DISTINCT FROM 'user' THEN
    v_allowed := false;
  END IF;

  IF v_allowed AND v_mode = 'vendor' THEN
    v_allowed := public.user_has_vendor_membership(p_user_id)
      OR public.has_context_switch_grant(p_user_id, 'vendor', v_entity_id)
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role IN ('admin', 'uno_team'));
  END IF;

  IF v_allowed AND v_mode = 'owner' THEN
    v_allowed := public.user_has_owner_org_membership(p_user_id)
      OR public.has_context_switch_grant(p_user_id, 'owner', v_entity_id)
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role IN ('admin', 'uno_team'));
  END IF;

  IF v_allowed AND v_mode = 'mc' THEN
    v_allowed := EXISTS (
        SELECT 1 FROM public.management_company_members m
        WHERE m.user_id = p_user_id AND m.is_active = true
          AND (v_entity_id IS NULL OR m.company_id = v_entity_id)
      )
      OR public.has_context_switch_grant(p_user_id, 'mc', v_entity_id)
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role IN ('admin', 'uno_team'));
  END IF;

  IF v_allowed AND v_mode = 'investor' THEN
    v_allowed := EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = 'investor'::public.app_role)
      OR public.has_context_switch_grant(p_user_id, 'investor', v_entity_id)
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role IN ('admin', 'uno_team'));
  END IF;

  IF v_allowed AND v_mode IN ('admin', 'team', 'staff') THEN
    IF v_mode = 'admin' THEN
      v_allowed := EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role IN ('admin', 'uno_team'))
        OR public.has_context_switch_grant(p_user_id, 'admin', v_entity_id);
    ELSIF v_mode = 'team' THEN
      v_allowed := EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role IN ('uno_team', 'admin'))
        OR public.has_context_switch_grant(p_user_id, 'team', v_entity_id);
    ELSE
      v_allowed := EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = 'staff'::public.app_role)
        OR public.has_context_switch_grant(p_user_id, 'staff', v_entity_id);
    END IF;
  END IF;

  IF NOT v_allowed THEN
    v_mode := 'user';
    v_entity_id := NULL;
  END IF;

  CASE v_mode
    WHEN 'mc' THEN
      SELECT mcm.role INTO v_mc_role
      FROM management_company_members mcm
      WHERE mcm.user_id = p_user_id
        AND mcm.company_id = v_entity_id
        AND mcm.is_active = true;

      IF v_mc_role IS NULL THEN
        IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role IN ('admin', 'uno_team')) THEN
          v_role := 'admin';
          v_permissions := ARRAY['*'];
        ELSE
          v_mode := 'user';
          v_role := 'user';
          v_permissions := ARRAY[]::text[];
        END IF;
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
        v_permissions := ARRAY[]::text[];
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
        v_permissions := ARRAY[]::text[];
      END IF;

    WHEN 'staff' THEN
      IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'staff'::public.app_role) THEN
        v_role := 'staff';
        v_permissions := ARRAY['operations', 'bookings', 'messages', 'channels'];
      ELSE
        v_mode := 'user';
        v_role := 'user';
        v_permissions := ARRAY[]::text[];
      END IF;

    WHEN 'investor' THEN
      IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'investor'::public.app_role) THEN
        v_role := 'investor';
        v_permissions := ARRAY['capital', 'deals', 'reports'];
      ELSIF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role IN ('admin', 'uno_team')) THEN
        v_role := 'admin';
        v_permissions := ARRAY['*'];
      ELSE
        v_mode := 'user';
        v_role := 'user';
        v_permissions := ARRAY[]::text[];
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

COMMENT ON FUNCTION public.resolve_user_context(uuid, text, uuid) IS
  'Resolves active context with role_context_policy validation, membership checks, and investor mode.';

-- 6) RPC: log platform impersonation (admin only)
CREATE OR REPLACE FUNCTION public.log_platform_impersonation(
  p_target_user_id uuid,
  p_action text,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF p_action NOT IN ('enter', 'exit') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  -- exit may omit target; enter should set target (optional note for support ticket id etc.)
  INSERT INTO public.platform_impersonation_log (actor_id, target_user_id, action, note)
  VALUES (auth.uid(), p_target_user_id, p_action, p_note);
END;
$$;

REVOKE ALL ON FUNCTION public.log_platform_impersonation(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_platform_impersonation(uuid, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.has_context_switch_grant(uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_has_vendor_membership(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_has_owner_org_membership(uuid) FROM PUBLIC;
