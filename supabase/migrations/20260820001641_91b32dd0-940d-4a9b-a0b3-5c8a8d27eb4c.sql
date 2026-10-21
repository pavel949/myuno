CREATE OR REPLACE FUNCTION public.create_partner_onboarding(
  p_user_id uuid,
  p_business_name text,
  p_business_category text,
  p_verticals text[] DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_contact_name text DEFAULT NULL,
  p_language text DEFAULT 'ru'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id uuid;
  v_mv_id uuid;
  v_org_id uuid;
  v_app_id uuid;
  v_slug text;
  v_existing_app uuid;
BEGIN
  IF p_user_id IS NULL OR coalesce(btrim(p_business_name), '') = '' OR coalesce(btrim(p_business_category), '') = '' THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  SELECT id INTO v_provider_id FROM public.providers WHERE user_id = p_user_id LIMIT 1;

  IF v_provider_id IS NULL THEN
    v_slug := left(regexp_replace(lower(p_business_name), '[^a-z0-9]+', '-', 'g'), 50)
              || '-' || to_hex((extract(epoch from now()) * 1000)::bigint);
    v_slug := btrim(v_slug, '-');

    INSERT INTO public.marketplace_vendors (slug, name_en, name_ru, is_active, is_verified, approval_status)
    VALUES (v_slug, p_business_name, p_business_name, false, false, 'pending')
    RETURNING id INTO v_mv_id;

    INSERT INTO public.providers (
      user_id, name, business_category, phone, email,
      commission_rate, is_verified, is_active, marketplace_vendor_id
    )
    VALUES (
      p_user_id, p_business_name, p_business_category, p_phone, p_email,
      10, false, false, v_mv_id
    )
    RETURNING id INTO v_provider_id;

    INSERT INTO public.orgs (org_type, name, name_ru, phone, email, is_verified, is_active, metadata)
    VALUES (
      'vendor', p_business_name, p_business_name, p_phone, p_email, false, false,
      jsonb_build_object(
        'legacy_provider_id', v_provider_id,
        'marketplace_vendor_id', v_mv_id,
        'verticals', to_jsonb(coalesce(p_verticals, ARRAY[p_business_category]))
      )
    )
    RETURNING id INTO v_org_id;

    INSERT INTO public.org_members (org_id, user_id, role, is_active)
    VALUES (v_org_id, p_user_id, 'owner', true);
  END IF;

  SELECT id INTO v_existing_app
  FROM public.partner_applications
  WHERE user_id = p_user_id
    AND status IN ('pending', 'reviewing')
    AND created_at >= now() - interval '7 days'
  LIMIT 1;

  IF v_existing_app IS NOT NULL THEN
    RETURN jsonb_build_object(
      'provider_id', v_provider_id,
      'org_id', v_org_id,
      'application_id', v_existing_app,
      'duplicate', true
    );
  END IF;

  INSERT INTO public.partner_applications (
    user_id, business_name, business_category, contact_name,
    contact_email, contact_phone, status, metadata
  )
  VALUES (
    p_user_id, p_business_name, p_business_category,
    coalesce(nullif(btrim(coalesce(p_contact_name, '')), ''), p_business_name),
    p_email, p_phone, 'pending',
    jsonb_build_object(
      'source', 'vendor_onboarding',
      'language', p_language,
      'provider_id', v_provider_id,
      'vertical', p_business_category
    )
  )
  RETURNING id INTO v_app_id;

  RETURN jsonb_build_object(
    'provider_id', v_provider_id,
    'org_id', v_org_id,
    'application_id', v_app_id,
    'duplicate', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_partner_onboarding(uuid, text, text, text[], text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_partner_onboarding(uuid, text, text, text[], text, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.create_partner_onboarding(uuid, text, text, text[], text, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_partner_onboarding(uuid, text, text, text[], text, text, text, text) TO service_role;