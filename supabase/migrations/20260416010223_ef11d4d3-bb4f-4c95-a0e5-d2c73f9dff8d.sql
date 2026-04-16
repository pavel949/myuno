
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can read daily briefs" ON public.founder_daily_brief;
DROP POLICY IF EXISTS "Authenticated users can insert daily briefs" ON public.founder_daily_brief;
DROP POLICY IF EXISTS "Authenticated users can update daily briefs" ON public.founder_daily_brief;
DROP POLICY IF EXISTS "Authenticated users can delete daily briefs" ON public.founder_daily_brief;
DROP POLICY IF EXISTS "Anyone can read" ON public.founder_daily_brief;
DROP POLICY IF EXISTS "Anyone can insert" ON public.founder_daily_brief;

-- Admin-only SELECT
CREATE POLICY "Admin can read daily brief" ON public.founder_daily_brief
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team')
);

-- Admin-only INSERT
CREATE POLICY "Admin can insert daily brief" ON public.founder_daily_brief
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team')
);

-- Admin-only UPDATE
CREATE POLICY "Admin can update daily brief" ON public.founder_daily_brief
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team')
);

-- Admin-only DELETE
CREATE POLICY "Admin can delete daily brief" ON public.founder_daily_brief
FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team')
);
