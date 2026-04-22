-- ============================================================================
-- Fix: Security Definer View linter error (linter rule 0010)
-- The view inherits privileges of view-creator otherwise, bypassing RLS.
-- Solution: use security_invoker=true and inline the role mapping.
-- ============================================================================

DROP VIEW IF EXISTS public.v_profiles_canonical;

CREATE VIEW public.v_profiles_canonical
WITH (security_invoker = true)
AS
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
  -- Inline canonical role mapping (no SECURITY DEFINER calls)
  (
    SELECT CASE
      WHEN bool_or(ur.role IN ('vendor'::app_role, 'partner'::app_role)) THEN 'provider'
      WHEN bool_or(ur.role IN ('property_owner'::app_role, 'owner'::app_role)) THEN 'operator'
      WHEN bool_or(ur.role = 'broker'::app_role) THEN 'investor-active'
      WHEN bool_or(ur.role = 'investor'::app_role) THEN 'investor-passive'
      WHEN bool_or(ur.role = 'resident'::app_role) THEN 'resident-user'
      ELSE 'consumer'
    END
    FROM public.user_roles ur
    WHERE ur.user_id = p.id
  ) AS canonical_primary_role,
  (
    SELECT COALESCE(
      array_agg(DISTINCT canonical) FILTER (WHERE canonical IS NOT NULL),
      '{}'::text[]
    )
    FROM (
      SELECT CASE ur.role::text
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
      FROM public.user_roles ur
      WHERE ur.user_id = p.id
    ) mapped
  ) AS canonical_all_roles
FROM public.profiles p;

COMMENT ON VIEW public.v_profiles_canonical IS
'Read-only profile view with inline canonical 6-role mapping. Uses security_invoker=true to inherit RLS from profiles table (linter rule 0010). For RLS policy gating, use has_canonical_role() function directly.';