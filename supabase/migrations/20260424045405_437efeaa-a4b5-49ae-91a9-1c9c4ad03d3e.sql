-- Fix WARN 1+2: pin search_path on remaining helper functions
CREATE OR REPLACE FUNCTION public.normalize_phone(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p IS NULL OR length(trim(p)) = 0 THEN NULL
    ELSE regexp_replace(trim(p), '[^0-9+]', '', 'g')
  END
$$;

CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Fix WARN 3+4: move citext extension out of public schema
-- Note: ALTER EXTENSION SET SCHEMA also relocates the citext type itself
-- to the new schema. We need to keep the column type accessible, so we
-- ensure the new schema is on the search_path for the contact_identities
-- column reference and any function that touches it.
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION citext SET SCHEMA extensions;

-- The column public.contact_identities.primary_email is now of type
-- extensions.citext. Make sure the find_or_create_identity function
-- can resolve the type by qualifying the search_path.
CREATE OR REPLACE FUNCTION public.find_or_create_identity(
  _email text,
  _phone text,
  _user_id uuid,
  _display_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_email extensions.citext := NULLIF(lower(trim(coalesce(_email,''))), '')::extensions.citext;
  v_phone text   := normalize_phone(_phone);
  v_id    uuid;
BEGIN
  IF _user_id IS NOT NULL THEN
    SELECT id INTO v_id FROM contact_identities WHERE primary_user_id = _user_id LIMIT 1;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  END IF;

  IF v_email IS NOT NULL THEN
    SELECT id INTO v_id FROM contact_identities WHERE primary_email = v_email LIMIT 1;
    IF v_id IS NOT NULL THEN
      UPDATE contact_identities SET
        primary_phone   = COALESCE(primary_phone, v_phone),
        primary_user_id = COALESCE(primary_user_id, _user_id),
        display_name    = COALESCE(display_name, _display_name),
        updated_at      = now()
      WHERE id = v_id;
      RETURN v_id;
    END IF;
  END IF;

  IF v_phone IS NOT NULL THEN
    SELECT id INTO v_id FROM contact_identities WHERE primary_phone = v_phone LIMIT 1;
    IF v_id IS NOT NULL THEN
      UPDATE contact_identities SET
        primary_email   = COALESCE(primary_email, v_email),
        primary_user_id = COALESCE(primary_user_id, _user_id),
        display_name    = COALESCE(display_name, _display_name),
        updated_at      = now()
      WHERE id = v_id;
      RETURN v_id;
    END IF;
  END IF;

  INSERT INTO contact_identities(primary_email, primary_phone, primary_user_id, display_name)
  VALUES (v_email, v_phone, _user_id, _display_name)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
