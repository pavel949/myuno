-- Allow any active member of a management company to create the onboarding
-- progress row for their company. Previously only owners/admins could insert,
-- so useMcOnboarding's auto-create upsert failed with RLS for regular members.
CREATE POLICY "MC members can create onboarding"
ON public.mc_onboarding_progress
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.management_company_members m
    WHERE m.company_id = mc_onboarding_progress.company_id
      AND m.user_id = auth.uid()
      AND m.is_active = true
  )
);