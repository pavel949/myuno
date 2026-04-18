-- Automatic QA multi-role bundle: RPC + config table (no migration email edit).
-- After login, the client calls ensure_multi_role_qa_bundle(); grants apply when enabled and the user matches allowlist.

CREATE TABLE IF NOT EXISTS public.qa_multi_role_auto_config (
  id smallint PRIMARY KEY CHECK (id = 1),
  is_enabled boolean NOT NULL DEFAULT false,
  email_domain_suffixes text[] NOT NULL DEFAULT '{}',
  extra_user_ids uuid[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.qa_multi_role_auto_config IS
  'Single-row config for ensure_multi_role_qa_bundle(): who may receive QA multi-role seeds. Update via SQL; not exposed to clients.';

INSERT INTO public.qa_multi_role_auto_config (id, is_enabled, email_domain_suffixes, extra_user_ids)
VALUES (1, false, '{}', '{}')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.qa_multi_role_auto_config ENABLE ROW LEVEL SECURITY;

-- Idempotent org/MC seeds + role rows (same UUIDs as 20260418120000_qa_multi_role_access.sql)
CREATE OR REPLACE FUNCTION public.apply_qa_multi_role_bundle_to_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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

  INSERT INTO public.user_roles (user_id, role) VALUES
    (p_user_id, 'admin'::public.app_role),
    (p_user_id, 'uno_team'::public.app_role),
    (p_user_id, 'staff'::public.app_role),
    (p_user_id, 'vendor'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.org_members (org_id, user_id, role, is_active)
  VALUES
    (v_vendor_org, p_user_id, 'owner', true),
    (v_owner_org, p_user_id, 'owner', true)
  ON CONFLICT (org_id, user_id) DO UPDATE SET is_active = true, role = EXCLUDED.role;

  INSERT INTO public.management_company_members (company_id, user_id, role, is_active)
  VALUES (v_mc_id, p_user_id, 'owner', true)
  ON CONFLICT (company_id, user_id) DO UPDATE SET is_active = true, role = EXCLUDED.role;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_multi_role_qa_bundle()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_domain text;
  v_cfg public.qa_multi_role_auto_config%ROWTYPE;
  v_match boolean := false;
  v_suffix text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'not_authenticated');
  END IF;

  SELECT * INTO v_cfg FROM public.qa_multi_role_auto_config WHERE id = 1;
  IF v_cfg IS NULL OR NOT v_cfg.is_enabled THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'disabled');
  END IF;

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = v_uid;
  IF v_email IS NULL OR length(trim(v_email)) = 0 THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'no_email');
  END IF;

  v_email := lower(trim(v_email));
  v_domain := lower(split_part(v_email, '@', 2));

  IF v_cfg.extra_user_ids IS NOT NULL AND array_length(v_cfg.extra_user_ids, 1) IS NOT NULL THEN
    IF v_uid = ANY(v_cfg.extra_user_ids) THEN
      v_match := true;
    END IF;
  END IF;

  IF NOT v_match AND v_cfg.email_domain_suffixes IS NOT NULL AND array_length(v_cfg.email_domain_suffixes, 1) IS NOT NULL THEN
    FOREACH v_suffix IN ARRAY v_cfg.email_domain_suffixes LOOP
      IF v_suffix IS NOT NULL AND length(trim(v_suffix)) > 0 AND v_domain = lower(trim(v_suffix)) THEN
        v_match := true;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  IF NOT v_match THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'not_in_allowlist');
  END IF;

  PERFORM public.apply_qa_multi_role_bundle_to_user(v_uid);
  RETURN jsonb_build_object('applied', true, 'reason', 'ok');
END;
$$;

COMMENT ON FUNCTION public.ensure_multi_role_qa_bundle() IS
  'Idempotent QA multi-role grants for auth.uid() when qa_multi_role_auto_config allows (domain suffix or explicit user id).';

REVOKE ALL ON FUNCTION public.apply_qa_multi_role_bundle_to_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_multi_role_qa_bundle() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.ensure_multi_role_qa_bundle() TO authenticated;
