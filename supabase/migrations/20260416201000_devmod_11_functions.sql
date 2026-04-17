-- =============================================================
-- Developer Module | Migration 11: Helper functions
--
-- devmod_compute_fingerprint   — SHA-256 contact de-duplication hash
-- devmod_attempt_unit_transition — atomic state machine with optimistic lock
-- devmod_release_expired_holds   — cron job to expire soft holds
-- =============================================================

-- -------------------------------------------------------------
-- 1. devmod_compute_fingerprint
--
-- Produces a stable SHA-256 fingerprint from contact identifiers.
-- Used to de-duplicate leads who submit with different contact formats
-- (e.g. "+7 912…" vs "79123…", or "User@Gmail.COM" vs "user@gmail.com").
--
-- Normalisation rules:
--   email   → lowercase, trim
--   phone   → digits only (strips +, spaces, dashes, parentheses)
--   passport → lowercase, trim (optional)
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.devmod_compute_fingerprint(
  p_email    text,
  p_phone    text,
  p_passport text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized text;
BEGIN
  v_normalized :=
    lower(trim(coalesce(p_email, '')))
    || regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')
    || lower(trim(coalesce(p_passport, '')));

  -- encode(digest(text, 'sha256'), 'hex') requires pgcrypto (enabled by default in Supabase)
  RETURN encode(digest(v_normalized::bytea, 'sha256'), 'hex');
END;
$$;

-- -------------------------------------------------------------
-- 2. devmod_attempt_unit_transition
--
-- Atomically transitions a unit's unit_status if and only if:
--   - current unit_status equals p_from_status
--   - current status_version equals p_expected_version
--
-- On success: bumps status_version and returns true.
-- On conflict (stale version or wrong current status): returns false.
-- Caller should return 409 to the client on false.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.devmod_attempt_unit_transition(
  p_unit_id          uuid,
  p_from_status      text,
  p_to_status        text,
  p_expected_version integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_updated integer;
BEGIN
  UPDATE public.project_units
  SET
    unit_status    = p_to_status,
    status_version = status_version + 1
  WHERE id              = p_unit_id
    AND unit_status     = p_from_status
    AND status_version  = p_expected_version;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  RETURN v_rows_updated = 1;
END;
$$;

-- -------------------------------------------------------------
-- 3. devmod_release_expired_holds
--
-- Intended to be called by a pg_cron job every minute.
-- Finds all unit_holds of type 'soft_hold' that have expired
-- (expires_at < now()) and have not yet been released.
-- For each: marks hold as released, transitions unit back to 'available'.
-- Returns count of holds released.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.devmod_release_expired_holds()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_released integer := 0;
BEGIN
  -- Mark expired holds as released
  WITH expired_holds AS (
    UPDATE public.unit_holds
    SET
      released_at     = now(),
      released_reason = 'expired'
    WHERE hold_type   = 'soft_hold'
      AND released_at IS NULL
      AND expires_at  < now()
    RETURNING unit_id, id
  ),
  -- Transition those units back to 'available' (only if still in soft_hold)
  unit_updates AS (
    UPDATE public.project_units pu
    SET
      unit_status    = 'available',
      status_version = status_version + 1
    FROM expired_holds eh
    WHERE pu.id          = eh.unit_id
      AND pu.unit_status = 'soft_hold'
    RETURNING pu.id
  )
  SELECT count(*) INTO v_released FROM unit_updates;

  RETURN v_released;
END;
$$;

-- -------------------------------------------------------------
-- 4. devmod_update_foreign_quota
--
-- Recalculates foreign quota tracking on a project whenever a unit
-- changes to 'sold'. Called by trigger or explicitly after sale completion.
-- Per spec R7: system-enforced, not advisory.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.devmod_update_foreign_quota(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_units         integer;
  v_foreign_units_sold  integer;
  v_thai_units_sold     integer;
BEGIN
  SELECT total_units INTO v_total_units
  FROM public.property_projects
  WHERE id = p_project_id;

  SELECT
    count(*) FILTER (WHERE b.nationality != 'TH'),
    count(*) FILTER (WHERE b.nationality = 'TH')
  INTO v_foreign_units_sold, v_thai_units_sold
  FROM public.project_units pu
  JOIN public.reservations r  ON r.unit_id = pu.id
  JOIN public.buyers b        ON b.id = r.buyer_id
  WHERE pu.project_id = p_project_id
    AND pu.unit_status = 'sold';

  UPDATE public.property_projects
  SET
    foreign_units_sold     = v_foreign_units_sold,
    thai_units_sold        = v_thai_units_sold,
    foreign_quota_used_pct = CASE
                               WHEN v_total_units > 0
                               THEN (v_foreign_units_sold::numeric / v_total_units) * 100
                               ELSE 0
                             END
  WHERE id = p_project_id;
END;
$$;
