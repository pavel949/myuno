-- Drop the problematic policy and create a new one using auth.jwt() instead
DROP POLICY IF EXISTS "invites_access" ON public.property_ownership_invites;

-- Create policy that allows:
-- 1. Inviters to see/manage their sent invites
-- 2. Invitees to see/accept/decline invites addressed to them (by email from JWT)
CREATE POLICY "invites_access" ON public.property_ownership_invites
FOR ALL USING (
  inviter_id = auth.uid() OR
  invitee_email = auth.jwt() ->> 'email'
) WITH CHECK (
  inviter_id = auth.uid() OR
  invitee_email = auth.jwt() ->> 'email'
);