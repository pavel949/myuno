-- Add created_by column to track project ownership
ALTER TABLE public.property_projects
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.property_projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.property_projects;

-- Create proper RLS policies with ownership check
CREATE POLICY "Users can create their own projects"
  ON public.property_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own projects"
  ON public.property_projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own projects"
  ON public.property_projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);