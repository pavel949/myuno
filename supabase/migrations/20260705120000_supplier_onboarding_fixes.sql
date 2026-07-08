-- Supplier onboarding hardening — audit findings F8 & F9.
-- Additive + idempotent. Safe to apply: F8 only ADDS access for the trusted
-- internal uno_team role (RLS is permissive-OR, so no existing access is removed),
-- and F9 drops a function that has no caller in the codebase.

-- ── F8 · uno_team is admin-equivalent everywhere in the UI/guards, but the
--    partner_applications admin policies gated on 'admin' only, so a uno_team
--    operator could open the moderation page yet not read/update applications
--    (and the approve-partner-application edge fn 403'd them — fixed in code).
--    Add additive uno_team policies mirroring the existing admin ones. ────────
DROP POLICY IF EXISTS "Uno team can view all partner applications" ON public.partner_applications;
CREATE POLICY "Uno team can view all partner applications"
ON public.partner_applications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'uno_team'));

DROP POLICY IF EXISTS "Uno team can update partner applications" ON public.partner_applications;
CREATE POLICY "Uno team can update partner applications"
ON public.partner_applications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'uno_team'))
WITH CHECK (public.has_role(auth.uid(), 'uno_team'));

-- ── F9 · Remove the stale, uncalled duplicate approval implementation. The live
--    activation path is the approve-partner-application edge function; this
--    SECURITY DEFINER SQL function has divergent provider-creation semantics and
--    no caller anywhere in the repo. Dropping it removes a foot-gun. ───────────
DROP FUNCTION IF EXISTS public.create_vendor_from_partner_application(uuid);
