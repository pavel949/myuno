
-- Drop the old permissive "System can manage listing scores" policy
DROP POLICY IF EXISTS "System can manage listing scores" ON public.property_listing_scores;
