-- Allow authenticated users to create orgs (for vendor onboarding)
CREATE POLICY "Authenticated users can create orgs"
ON public.orgs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to add themselves as org members when creating org
CREATE POLICY "Users can insert themselves as org members"
ON public.org_members FOR INSERT
WITH CHECK (auth.uid() = user_id);