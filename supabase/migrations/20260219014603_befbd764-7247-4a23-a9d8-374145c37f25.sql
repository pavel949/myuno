
-- Fix RLS policies on property_reports: unify permission key 'financial' → 'financials'

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Owners can view their reports" ON property_reports;

-- Recreate SELECT policy with correct key 'financials'
CREATE POLICY "Owners can view their reports"
ON property_reports FOR SELECT
USING (
  owner_id = auth.uid()
  OR generated_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM property_delegates pd
    WHERE pd.property_id = property_reports.property_id
      AND pd.user_id = auth.uid()
      AND pd.status = 'active'
      AND ((pd.permissions->>'financials')::boolean = true)
  )
);

-- Drop old INSERT policy
DROP POLICY IF EXISTS "Users can create reports for their properties" ON property_reports;

-- Recreate INSERT policy with correct key 'financials'
CREATE POLICY "Owners and managers can create reports"
ON property_reports FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM owner_properties op
    WHERE op.id = property_reports.property_id
      AND op.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM property_delegates pd
    WHERE pd.property_id = property_reports.property_id
      AND pd.user_id = auth.uid()
      AND pd.status = 'active'
      AND ((pd.permissions->>'financials')::boolean = true)
  )
);
