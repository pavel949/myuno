-- =============================================
-- Property Delegates: Multi-user access delegation
-- =============================================
CREATE TABLE public.property_delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('trustee', 'agent', 'manager', 'management_company')),
  permissions JSONB DEFAULT '{"view": true, "edit": false, "financials": false, "bookings": true, "maintenance": false}'::jsonb,
  invited_by UUID REFERENCES auth.users(id),
  invited_email TEXT,
  invited_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked', 'expired')),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: one role per user per property
CREATE UNIQUE INDEX idx_property_delegates_unique ON public.property_delegates(property_id, user_id) WHERE user_id IS NOT NULL AND status = 'active';
CREATE INDEX idx_property_delegates_user ON public.property_delegates(user_id);
CREATE INDEX idx_property_delegates_property ON public.property_delegates(property_id);
CREATE INDEX idx_property_delegates_email ON public.property_delegates(invited_email) WHERE invited_email IS NOT NULL;

-- Enable RLS
ALTER TABLE public.property_delegates ENABLE ROW LEVEL SECURITY;

-- Owners can manage delegates for their properties
CREATE POLICY "Owners can manage their property delegates"
ON public.property_delegates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = property_id AND op.owner_id = auth.uid()
  )
);

-- Delegates can view their own delegation records
CREATE POLICY "Delegates can view their assignments"
ON public.property_delegates
FOR SELECT
USING (user_id = auth.uid());

-- Users can accept invitations sent to their email
CREATE POLICY "Users can accept invitations"
ON public.property_delegates
FOR UPDATE
USING (
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND status = 'pending'
)
WITH CHECK (
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- =============================================
-- Property Activity Log: Audit trail
-- =============================================
CREATE TABLE public.property_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT CHECK (actor_role IN ('owner', 'trustee', 'agent', 'manager', 'management_company', 'uno_team', 'system')),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_property_activity_log_property ON public.property_activity_log(property_id);
CREATE INDEX idx_property_activity_log_actor ON public.property_activity_log(actor_id);
CREATE INDEX idx_property_activity_log_created ON public.property_activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.property_activity_log ENABLE ROW LEVEL SECURITY;

-- Owners can view activity for their properties
CREATE POLICY "Owners can view property activity"
ON public.property_activity_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = property_id AND op.owner_id = auth.uid()
  )
);

-- Delegates with view permission can see activity
CREATE POLICY "Delegates can view property activity"
ON public.property_activity_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_delegates pd
    WHERE pd.property_id = property_activity_log.property_id
    AND pd.user_id = auth.uid()
    AND pd.status = 'active'
    AND (pd.permissions->>'view')::boolean = true
  )
);

-- System can insert activity logs
CREATE POLICY "Authenticated users can log activity"
ON public.property_activity_log
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- Add management_type to owner_properties if not exists
-- =============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'owner_properties' 
    AND column_name = 'managed_by'
  ) THEN
    ALTER TABLE public.owner_properties ADD COLUMN managed_by TEXT DEFAULT 'owner' CHECK (managed_by IN ('owner', 'trustee', 'agent', 'management_company', 'uno'));
  END IF;
END $$;

-- =============================================
-- Function to get user's role for a property
-- =============================================
CREATE OR REPLACE FUNCTION public.get_property_user_role(p_property_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check if user is owner
  IF EXISTS (SELECT 1 FROM owner_properties WHERE id = p_property_id AND owner_id = p_user_id) THEN
    RETURN 'owner';
  END IF;
  
  -- Check delegates
  SELECT role INTO v_role
  FROM property_delegates
  WHERE property_id = p_property_id
    AND user_id = p_user_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
  
  RETURN v_role;
END;
$$;

-- =============================================
-- Function to check if user has permission
-- =============================================
CREATE OR REPLACE FUNCTION public.check_property_permission(p_property_id UUID, p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_permissions JSONB;
BEGIN
  -- Owner has all permissions
  IF EXISTS (SELECT 1 FROM owner_properties WHERE id = p_property_id AND owner_id = p_user_id) THEN
    RETURN true;
  END IF;
  
  -- Check delegate permissions
  SELECT permissions INTO v_permissions
  FROM property_delegates
  WHERE property_id = p_property_id
    AND user_id = p_user_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
  
  IF v_permissions IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN COALESCE((v_permissions->>p_permission)::boolean, false);
END;
$$;

-- =============================================
-- Trigger to log property changes
-- =============================================
CREATE OR REPLACE FUNCTION public.log_property_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_actor_role TEXT;
  v_action TEXT;
BEGIN
  -- Determine actor role
  v_actor_role := get_property_user_role(
    COALESCE(NEW.property_id, NEW.id, OLD.property_id, OLD.id),
    auth.uid()
  );
  
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    v_action := 'created_' || TG_TABLE_NAME;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'updated_' || TG_TABLE_NAME;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted_' || TG_TABLE_NAME;
  END IF;
  
  -- Insert log entry
  INSERT INTO property_activity_log (
    property_id,
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    COALESCE(NEW.property_id, NEW.id, OLD.property_id, OLD.id),
    auth.uid(),
    COALESCE(v_actor_role, 'system'),
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      ELSE jsonb_build_object('new', to_jsonb(NEW), 'old', to_jsonb(OLD))
    END
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Add triggers for key tables
CREATE TRIGGER log_property_bookings_activity
AFTER INSERT OR UPDATE OR DELETE ON public.property_bookings
FOR EACH ROW EXECUTE FUNCTION log_property_activity();

CREATE TRIGGER log_property_financials_activity
AFTER INSERT OR UPDATE OR DELETE ON public.property_financials
FOR EACH ROW EXECUTE FUNCTION log_property_activity();

-- Update updated_at trigger for delegates
CREATE TRIGGER update_property_delegates_updated_at
BEFORE UPDATE ON public.property_delegates
FOR EACH ROW EXECUTE FUNCTION update_updated_at();