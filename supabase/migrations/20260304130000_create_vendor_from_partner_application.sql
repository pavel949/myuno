-- Create vendor (provider + org + org_members + user_roles) when a partner application is approved.
-- Called from admin UI after setting partner_applications.status = 'approved'.
-- Requires: application row already updated to status = 'approved', and user_id is not null.

CREATE OR REPLACE FUNCTION public.create_vendor_from_partner_application(_application_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _app record;
  _provider_id uuid;
  _org_id uuid;
BEGIN
  -- 1. Load application (must be approved and have user_id)
  SELECT id, user_id, business_name, business_category, business_description,
         contact_email, contact_phone, website, address, city
  INTO _app
  FROM public.partner_applications
  WHERE id = _application_id
    AND status = 'approved'
    AND user_id IS NOT NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'application_not_found_or_not_approved');
  END IF;

  -- 2. Avoid duplicate provider for this user
  IF EXISTS (SELECT 1 FROM public.providers WHERE user_id = _app.user_id) THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'provider_already_exists');
  END IF;

  -- 3. Create provider
  INSERT INTO public.providers (
    user_id, name, description_en, business_category,
    phone, email, website, address,
    commission_rate, is_verified, is_active
  ) VALUES (
    _app.user_id,
    _app.business_name,
    _app.business_description,
    _app.business_category,
    _app.contact_phone,
    _app.contact_email,
    _app.website,
    COALESCE(_app.address || COALESCE(', ' || _app.city, ''), _app.address, _app.city),
    10,
    false,
    true
  )
  RETURNING id INTO _provider_id;

  -- 4. Create org (vendor)
  INSERT INTO public.orgs (
    org_type, name, name_ru, phone, email, address, is_verified, is_active,
    metadata
  ) VALUES (
    'vendor',
    _app.business_name,
    _app.business_name,
    _app.contact_phone,
    _app.contact_email,
    COALESCE(_app.address, _app.city),
    false,
    true,
    jsonb_build_object('legacy_provider_id', _provider_id, 'verticals', ARRAY[_app.business_category])
  )
  RETURNING id INTO _org_id;

  -- 5. Add user as org owner
  INSERT INTO public.org_members (org_id, user_id, role, is_active)
  VALUES (_org_id, _app.user_id, 'owner', true);

  -- 6. Grant vendor role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_app.user_id, 'vendor'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'provider_id', _provider_id, 'org_id', _org_id);
END;
$$;

COMMENT ON FUNCTION public.create_vendor_from_partner_application(uuid) IS
  'Creates provider, org, org_members and user_roles for an approved partner application. Call after setting status=approved.';
