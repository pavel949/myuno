-- Drop overly permissive policy
DROP POLICY IF EXISTS "UNO team can manage transfers" ON public.transfers;

-- Create a proper policy for service account / seeding (insert only for initial data)
-- Since we're seeding as service role, we don't need a special policy
-- The existing provider policy + public read is sufficient