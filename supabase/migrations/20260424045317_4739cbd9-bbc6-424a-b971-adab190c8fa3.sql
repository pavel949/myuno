-- ============================================================
-- Stage 1 — CRM Identity Layer
-- Goal: link the same person across 3 CRM tables without merging them.
-- Safe for MC client: zero changes to crm_contacts data or RLS.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS citext;

-- ──────────────────────────────────────────────────────────
-- 1. contact_identities — one row per real person
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_email citext,
  primary_phone text,
  primary_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One identity per email / phone / user (partial unique indexes — nulls allowed)
CREATE UNIQUE INDEX IF NOT EXISTS contact_identities_email_uq
  ON public.contact_identities (primary_email)
  WHERE primary_email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS contact_identities_phone_uq
  ON public.contact_identities (primary_phone)
  WHERE primary_phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS contact_identities_user_uq
  ON public.contact_identities (primary_user_id)
  WHERE primary_user_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────
-- 2. contact_identity_links — identity ↔ source-table row
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_identity_links (
  identity_id uuid NOT NULL REFERENCES public.contact_identities(id) ON DELETE CASCADE,
  source_table text NOT NULL CHECK (source_table IN ('crm_contacts','capital_contacts','vendor_prospects')),
  source_id uuid NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_table, source_id)
);

CREATE INDEX IF NOT EXISTS contact_identity_links_identity_idx
  ON public.contact_identity_links (identity_id);

-- ──────────────────────────────────────────────────────────
-- 3. Helpers: phone normalizer (digits + leading +)
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.normalize_phone(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p IS NULL OR length(trim(p)) = 0 THEN NULL
    ELSE regexp_replace(trim(p), '[^0-9+]', '', 'g')
  END
$$;

-- ──────────────────────────────────────────────────────────
-- 4. find_or_create_identity — core matcher
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.find_or_create_identity(
  _email text,
  _phone text,
  _user_id uuid,
  _display_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email citext := NULLIF(lower(trim(coalesce(_email,''))), '')::citext;
  v_phone text   := normalize_phone(_phone);
  v_id    uuid;
BEGIN
  -- 1. user_id wins (strongest identity signal)
  IF _user_id IS NOT NULL THEN
    SELECT id INTO v_id FROM contact_identities WHERE primary_user_id = _user_id LIMIT 1;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  END IF;

  -- 2. email
  IF v_email IS NOT NULL THEN
    SELECT id INTO v_id FROM contact_identities WHERE primary_email = v_email LIMIT 1;
    IF v_id IS NOT NULL THEN
      -- enrich missing fields
      UPDATE contact_identities SET
        primary_phone   = COALESCE(primary_phone, v_phone),
        primary_user_id = COALESCE(primary_user_id, _user_id),
        display_name    = COALESCE(display_name, _display_name),
        updated_at      = now()
      WHERE id = v_id;
      RETURN v_id;
    END IF;
  END IF;

  -- 3. phone
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

  -- 4. nothing matched → create
  INSERT INTO contact_identities(primary_email, primary_phone, primary_user_id, display_name)
  VALUES (v_email, v_phone, _user_id, _display_name)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ──────────────────────────────────────────────────────────
-- 5. Trigger functions — one per source table
-- ──────────────────────────────────────────────────────────

-- crm_contacts (MC)
CREATE OR REPLACE FUNCTION public.tg_link_crm_contact_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identity uuid;
  v_name text;
BEGIN
  v_name := NULLIF(trim(coalesce(NEW.first_name,'') || ' ' || coalesce(NEW.last_name,'')), '');
  v_identity := find_or_create_identity(
    NEW.email,
    COALESCE(NEW.phone, NEW.mobile, NEW.whatsapp),
    NEW.linked_user_id,
    v_name
  );
  INSERT INTO contact_identity_links(identity_id, source_table, source_id)
  VALUES (v_identity, 'crm_contacts', NEW.id)
  ON CONFLICT (source_table, source_id) DO UPDATE SET identity_id = EXCLUDED.identity_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_crm_contact_identity ON public.crm_contacts;
CREATE TRIGGER trg_link_crm_contact_identity
AFTER INSERT OR UPDATE OF email, phone, mobile, whatsapp, linked_user_id, first_name, last_name
ON public.crm_contacts
FOR EACH ROW EXECUTE FUNCTION public.tg_link_crm_contact_identity();

-- capital_contacts
CREATE OR REPLACE FUNCTION public.tg_link_capital_contact_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identity uuid;
  v_name text;
BEGIN
  v_name := COALESCE(
    NULLIF(trim(coalesce(NEW.first_name,'') || ' ' || coalesce(NEW.last_name,'')), ''),
    NEW.name
  );
  v_identity := find_or_create_identity(
    NEW.email,
    COALESCE(NEW.phone, NEW.whatsapp_phone),
    NEW.user_id,
    v_name
  );
  INSERT INTO contact_identity_links(identity_id, source_table, source_id)
  VALUES (v_identity, 'capital_contacts', NEW.id)
  ON CONFLICT (source_table, source_id) DO UPDATE SET identity_id = EXCLUDED.identity_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_capital_contact_identity ON public.capital_contacts;
CREATE TRIGGER trg_link_capital_contact_identity
AFTER INSERT OR UPDATE OF email, phone, whatsapp_phone, user_id, first_name, last_name, name
ON public.capital_contacts
FOR EACH ROW EXECUTE FUNCTION public.tg_link_capital_contact_identity();

-- vendor_prospects — schema-tolerant column lookup via dynamic SQL
CREATE OR REPLACE FUNCTION public.tg_link_vendor_prospect_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identity uuid;
  v_email text;
  v_phone text;
  v_name text;
BEGIN
  -- Use to_jsonb for safe field access (vendor_prospects schema may evolve)
  v_email := (to_jsonb(NEW) ->> 'email');
  v_phone := COALESCE(
    to_jsonb(NEW) ->> 'phone',
    to_jsonb(NEW) ->> 'whatsapp',
    to_jsonb(NEW) ->> 'contact_phone'
  );
  v_name := COALESCE(
    to_jsonb(NEW) ->> 'business_name',
    to_jsonb(NEW) ->> 'company_name',
    to_jsonb(NEW) ->> 'name',
    to_jsonb(NEW) ->> 'contact_name'
  );
  v_identity := find_or_create_identity(v_email, v_phone, NULL, v_name);
  INSERT INTO contact_identity_links(identity_id, source_table, source_id)
  VALUES (v_identity, 'vendor_prospects', NEW.id)
  ON CONFLICT (source_table, source_id) DO UPDATE SET identity_id = EXCLUDED.identity_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_vendor_prospect_identity ON public.vendor_prospects;
CREATE TRIGGER trg_link_vendor_prospect_identity
AFTER INSERT OR UPDATE
ON public.vendor_prospects
FOR EACH ROW EXECUTE FUNCTION public.tg_link_vendor_prospect_identity();

-- ──────────────────────────────────────────────────────────
-- 6. Backfill 386 existing crm_contacts (one-shot)
-- ──────────────────────────────────────────────────────────
DO $$
DECLARE
  r record;
  v_identity uuid;
  v_name text;
BEGIN
  FOR r IN SELECT * FROM crm_contacts LOOP
    v_name := NULLIF(trim(coalesce(r.first_name,'') || ' ' || coalesce(r.last_name,'')), '');
    v_identity := find_or_create_identity(
      r.email,
      COALESCE(r.phone, r.mobile, r.whatsapp),
      r.linked_user_id,
      v_name
    );
    INSERT INTO contact_identity_links(identity_id, source_table, source_id)
    VALUES (v_identity, 'crm_contacts', r.id)
    ON CONFLICT (source_table, source_id) DO NOTHING;
  END LOOP;
END $$;

-- ──────────────────────────────────────────────────────────
-- 7. updated_at trigger
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_contact_identities ON public.contact_identities;
CREATE TRIGGER trg_touch_contact_identities
BEFORE UPDATE ON public.contact_identities
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- ──────────────────────────────────────────────────────────
-- 8. RLS — read-only for authenticated; writes only via function
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.contact_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_identity_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "identities readable by authenticated" ON public.contact_identities;
CREATE POLICY "identities readable by authenticated"
  ON public.contact_identities
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "identity links readable by authenticated" ON public.contact_identity_links;
CREATE POLICY "identity links readable by authenticated"
  ON public.contact_identity_links
  FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies — writes only via SECURITY DEFINER triggers/functions
REVOKE INSERT, UPDATE, DELETE ON public.contact_identities FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.contact_identity_links FROM authenticated;

-- ──────────────────────────────────────────────────────────
-- 9. v_unified_contacts — read-only union view (RLS inherited)
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_unified_contacts
WITH (security_invoker = true)
AS
SELECT
  ci.id                 AS identity_id,
  ci.display_name,
  ci.primary_email::text AS primary_email,
  ci.primary_phone,
  ci.primary_user_id,
  ci.created_at         AS identity_created_at,
  array_agg(DISTINCT cil.source_table ORDER BY cil.source_table) AS pipelines,
  jsonb_object_agg(cil.source_table, cil.source_id) AS source_ids,
  count(*)::int         AS pipeline_count
FROM public.contact_identities ci
LEFT JOIN public.contact_identity_links cil ON cil.identity_id = ci.id
GROUP BY ci.id;

GRANT SELECT ON public.v_unified_contacts TO authenticated;
