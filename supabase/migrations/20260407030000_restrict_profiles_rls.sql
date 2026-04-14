-- Restrict profiles SELECT policy: users can only read their own profile.
-- Admin/service-role access is unaffected (bypasses RLS).
-- Team members who need to look up other profiles should use service-role or
-- a dedicated RPC with security definer.

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
