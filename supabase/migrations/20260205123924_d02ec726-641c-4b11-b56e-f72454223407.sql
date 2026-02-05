-- Fix security warning: Replace overly permissive RLS policy on catalog_life_map
-- The SELECT USING(true) is intentional for public read access (linter excludes SELECT)
-- But we need to ensure INSERT/UPDATE/DELETE are properly restricted

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Catalog mappings are viewable by everyone" ON public.catalog_life_map;

-- Create separate policies for read vs write
CREATE POLICY "Catalog mappings are publicly readable"
ON public.catalog_life_map FOR SELECT
USING (true);

-- Ensure admin-only write is explicit for each operation
DROP POLICY IF EXISTS "Admins can manage catalog mappings" ON public.catalog_life_map;

CREATE POLICY "Admins can insert catalog mappings"
ON public.catalog_life_map FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update catalog mappings"
ON public.catalog_life_map FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete catalog mappings"
ON public.catalog_life_map FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);