
-- P0-1: Fix is_company_admin() to include 'director' role
CREATE OR REPLACE FUNCTION public.is_company_admin(p_company_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM management_company_members
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
      AND role IN ('director', 'admin', 'owner')
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'uno_team')
  );
$$;

-- P0-2: Add CHECK constraint on management_company_members.role
-- First verify existing roles in use
DO $$
BEGIN
  -- Add constraint only if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'management_company_members_role_check'
  ) THEN
    ALTER TABLE public.management_company_members 
    ADD CONSTRAINT management_company_members_role_check 
    CHECK (role IN ('director', 'admin', 'manager', 'accountant', 'staff', 'member'));
  END IF;
END $$;

-- P0-3: Create helper function for staff property scoping
CREATE OR REPLACE FUNCTION public.staff_can_access_property(p_user_id uuid, p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    -- Directors/admins of the company that manages the property — full access
    SELECT 1 FROM management_company_members mcm
    JOIN properties p ON p.management_company_id = mcm.company_id
    WHERE mcm.user_id = p_user_id
      AND p.id = p_property_id
      AND mcm.role IN ('director', 'admin')
      AND mcm.is_active = true
  )
  OR EXISTS (
    -- Managers/accountants — full company properties
    SELECT 1 FROM management_company_members mcm
    JOIN properties p ON p.management_company_id = mcm.company_id
    WHERE mcm.user_id = p_user_id
      AND p.id = p_property_id
      AND mcm.role IN ('manager', 'accountant')
      AND mcm.is_active = true
  )
  OR EXISTS (
    -- Staff — only assigned properties
    SELECT 1 FROM management_company_members mcm
    JOIN properties p ON p.management_company_id = mcm.company_id
    JOIN property_manager_assignments pma ON pma.property_id = p.id AND pma.manager_user_id = p_user_id
    WHERE mcm.user_id = p_user_id
      AND p.id = p_property_id
      AND mcm.role = 'staff'
      AND mcm.is_active = true
      AND pma.is_active = true
  )
  OR EXISTS (
    -- Platform admins
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id AND role IN ('admin', 'uno_team')
  );
$$;
