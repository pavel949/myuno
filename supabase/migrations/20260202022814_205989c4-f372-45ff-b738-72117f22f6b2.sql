-- Fix overly permissive INSERT policy for listing_applications
-- Replace WITH CHECK (true) with proper validation

DROP POLICY IF EXISTS "Anyone can create draft applications" ON public.listing_applications;

-- Allow inserting only draft applications, and user_id must match if provided
CREATE POLICY "Create draft applications"
ON public.listing_applications FOR INSERT
WITH CHECK (
  status = 'draft' 
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- Also need DELETE policy for users to remove their own drafts
CREATE POLICY "Users delete own draft applications"
ON public.listing_applications FOR DELETE
USING (auth.uid() = user_id AND status = 'draft');