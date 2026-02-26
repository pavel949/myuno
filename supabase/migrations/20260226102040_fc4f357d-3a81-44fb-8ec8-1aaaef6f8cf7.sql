-- Phase 1+2: MC company-scoped access improvements

-- 1. Add company_id to staff_members for MC-level staff visibility
ALTER TABLE public.staff_members 
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.management_companies(id);

CREATE INDEX IF NOT EXISTS idx_staff_members_company 
  ON public.staff_members(company_id);

-- 2. Backfill company_id from owner's MC membership
UPDATE public.staff_members sm
SET company_id = mcm.company_id
FROM public.management_company_members mcm
WHERE mcm.user_id = sm.owner_id
  AND mcm.is_active = true
  AND sm.company_id IS NULL;

-- 3. RLS: Allow MC members to view company staff
DROP POLICY IF EXISTS "mc_members_view_company_staff" ON public.staff_members;
CREATE POLICY "mc_members_view_company_staff" ON public.staff_members
  FOR SELECT USING (
    owner_id = auth.uid()
    OR (
      company_id IS NOT NULL 
      AND company_id IN (
        SELECT company_id FROM public.management_company_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- 4. RLS: Allow MC members to read financials for MC properties
DROP POLICY IF EXISTS "mc_members_view_property_financials" ON public.property_financials;
CREATE POLICY "mc_members_view_property_financials" ON public.property_financials
  FOR SELECT USING (
    owner_id = auth.uid()
    OR property_id IN (
      SELECT p.id FROM public.properties p
      JOIN public.management_company_members mcm 
        ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );

-- 5. RLS: Allow MC members to read property_bookings for MC properties
DROP POLICY IF EXISTS "mc_members_view_property_bookings" ON public.property_bookings;
CREATE POLICY "mc_members_view_property_bookings" ON public.property_bookings
  FOR SELECT USING (
    owner_id = auth.uid()
    OR property_id IN (
      SELECT p.id FROM public.properties p
      JOIN public.management_company_members mcm 
        ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );
