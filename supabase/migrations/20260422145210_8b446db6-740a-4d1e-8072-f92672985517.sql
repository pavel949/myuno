-- ============================================================================
-- M2 · Migration 2/3 · Canonical role mapping (no app_role enum changes)
-- Strategy decision: map canonical → existing app_role (not extend enum)
-- See: docs/canonical/01-segmentation-framework.md § 5 Role axis
-- ============================================================================

-- ---------- get_canonical_primary_role(user_id) ----------
-- Maps existing app_role hierarchy to canonical 6-role taxonomy.
-- Priority: provider > operator > investor-active > investor-passive > resident-user > consumer

CREATE OR REPLACE FUNCTION public.get_canonical_primary_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'vendor'::app_role)
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'partner'::app_role)
      THEN 'provider'
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'property_owner'::app_role)
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'owner'::app_role)
      THEN 'operator'
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'broker'::app_role)
      THEN 'investor-active'
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'investor'::app_role)
      THEN 'investor-passive'
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'resident'::app_role)
      THEN 'resident-user'
    ELSE 'consumer'
  END;
$$;

COMMENT ON FUNCTION public.get_canonical_primary_role(uuid) IS
'Maps existing app_role to canonical 6-role taxonomy from 01-segmentation-framework § 5. Priority: provider > operator > investor-active > investor-passive > resident-user > consumer.';

-- ---------- get_canonical_secondary_roles(user_id) ----------
-- All applicable canonical roles except the primary one.

CREATE OR REPLACE FUNCTION public.get_canonical_secondary_roles(_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH roles AS (
    SELECT DISTINCT
      CASE role::text
        WHEN 'vendor' THEN 'provider'
        WHEN 'partner' THEN 'provider'
        WHEN 'property_owner' THEN 'operator'
        WHEN 'owner' THEN 'operator'
        WHEN 'broker' THEN 'investor-active'
        WHEN 'investor' THEN 'investor-passive'
        WHEN 'resident' THEN 'resident-user'
        WHEN 'tourist' THEN 'consumer'
        WHEN 'guest' THEN 'consumer'
        WHEN 'user' THEN 'consumer'
        ELSE NULL
      END AS canonical
    FROM public.user_roles
    WHERE user_id = _user_id
  ),
  primary_role AS (
    SELECT public.get_canonical_primary_role(_user_id) AS p
  )
  SELECT COALESCE(array_agg(canonical) FILTER (WHERE canonical IS NOT NULL AND canonical <> (SELECT p FROM primary_role)), '{}'::text[])
  FROM roles;
$$;

COMMENT ON FUNCTION public.get_canonical_secondary_roles(uuid) IS
'Returns all canonical roles for user except the primary one. Used for role-stack weighted scoring.';

-- ---------- has_canonical_role(user_id, role) ----------
-- For use in future RLS policies that need canonical-role gating.

CREATE OR REPLACE FUNCTION public.has_canonical_role(_user_id uuid, _canonical_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _canonical_role = public.get_canonical_primary_role(_user_id)
      OR _canonical_role = ANY(public.get_canonical_secondary_roles(_user_id));
$$;

COMMENT ON FUNCTION public.has_canonical_role(uuid, text) IS
'Returns true if user has the given canonical role as primary or secondary. Use in RLS instead of querying user_roles directly.';

-- ---------- View v_profiles_canonical ----------
-- Read-only view exposing canonical roles alongside profile data.
-- RLS is inherited from underlying profiles table.

CREATE OR REPLACE VIEW public.v_profiles_canonical AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.preferred_language,
  p.user_type,
  p.lifecycle_stage,
  p.lifecycle_stage_history,
  p.first_visit_at,
  p.total_days_in_thailand,
  p.visits_count,
  p.next_lifecycle_stage_eta,
  p.household_type,
  p.special_status,
  p.kids_ages,
  p.detected_persona,
  p.detected_persona_confidence,
  p.active_clusters,
  p.triggers_active,
  p.created_at,
  p.updated_at,
  -- Canonical role mapping (computed)
  public.get_canonical_primary_role(p.id) AS canonical_primary_role,
  public.get_canonical_secondary_roles(p.id) AS canonical_secondary_roles
FROM public.profiles p;

COMMENT ON VIEW public.v_profiles_canonical IS
'Read-only profile view with canonical 6-role mapping computed via get_canonical_primary_role(). Inherits RLS from profiles table. Use this view in app code that needs canonical roles.';