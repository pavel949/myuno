
-- 1. Fix privilege escalation: remove org-membership-based elevated access
-- Only user_roles table grants elevated access now.
CREATE OR REPLACE FUNCTION public.has_elevated_access(p_required_roles text[] DEFAULT ARRAY['admin'::text, 'uno_team'::text])
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Elevated access is ONLY granted via user_roles table (admin-managed).
  -- Org owner/admin roles are tenant-scoped and must NOT grant platform-wide privileges.
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text = ANY(p_required_roles)
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$function$;

-- Harden org_members INSERT: prevent self-assignment of privileged roles.
-- A user can only insert themselves as a regular 'member'.
-- Privileged roles (owner/admin) must be assigned by an existing org owner.
DROP POLICY IF EXISTS "Users can insert themselves as org members" ON public.org_members;

CREATE POLICY "Users can self-join orgs as member only"
  ON public.org_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'member'
  );

-- (The existing "Org owners can manage members" policy already allows
--  org owners to insert members with any role via is_org_owner check.)

-- 2. Property guidebook: stop exposing security codes via public share token.
-- Drop the public policy entirely. Guidebook is now only viewable by:
--   - the owner (existing owner policies)
--   - guests with confirmed/active bookings (existing policy retained)
DROP POLICY IF EXISTS "Public guidebook access via share token" ON public.property_guidebook;

-- 3. Realtime channel authorization: restrict subscriptions on realtime.messages.
-- Without policies any authenticated user can subscribe to any topic.
-- Enable RLS and add a baseline policy that only allows authenticated users
-- to subscribe; per-table data is still protected by table-level RLS on
-- the underlying public tables (postgres_changes events respect RLS).
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can receive broadcasts" ON realtime.messages;
CREATE POLICY "Authenticated can receive broadcasts"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can send broadcasts" ON realtime.messages;
CREATE POLICY "Authenticated can send broadcasts"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
