-- Create property manager assignments table
CREATE TABLE IF NOT EXISTS public.property_manager_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  manager_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  permissions JSONB DEFAULT '{"calendar": true, "pricing": true, "bookings": true, "guests": true}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_id, manager_user_id)
);

-- Enable RLS
ALTER TABLE public.property_manager_assignments ENABLE ROW LEVEL SECURITY;

-- Managers can see their own assignments
CREATE POLICY "Managers can view own assignments"
ON public.property_manager_assignments
FOR SELECT
USING (manager_user_id = auth.uid());

-- Property owners can manage assignments for their properties
CREATE POLICY "Owners can manage assignments for their properties"
ON public.property_manager_assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_manager_assignments.property_id
    AND p.owner_id = auth.uid()
  )
);

-- Admins can manage all assignments
CREATE POLICY "Admins can manage all assignments"
ON public.property_manager_assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'uno_team', 'staff')
  )
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_manager_assignments_manager 
ON public.property_manager_assignments(manager_user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_manager_assignments_property 
ON public.property_manager_assignments(property_id) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_manager_assignments_updated_at
BEFORE UPDATE ON public.property_manager_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();