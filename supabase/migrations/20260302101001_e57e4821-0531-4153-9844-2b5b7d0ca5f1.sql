
-- P1: Create user_active_context table
CREATE TABLE IF NOT EXISTS public.user_active_context (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'user' CHECK (mode IN ('user', 'owner', 'mc', 'investor', 'vendor', 'admin', 'team')),
  entity_id uuid, -- company_id or other entity
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_active_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own context" ON public.user_active_context
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can upsert own context" ON public.user_active_context
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own context" ON public.user_active_context
FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Server-side context resolver function
CREATE OR REPLACE FUNCTION public.resolve_user_context(p_user_id uuid, p_mode text DEFAULT NULL, p_entity_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mode text;
  v_entity_id uuid;
  v_role text;
  v_permissions text[];
  v_mc_role text;
BEGIN
  -- Get current context or use provided override
  IF p_mode IS NOT NULL THEN
    v_mode := p_mode;
    v_entity_id := p_entity_id;
  ELSE
    SELECT mode, entity_id INTO v_mode, v_entity_id
    FROM user_active_context
    WHERE user_id = p_user_id;
    
    -- Default to 'user' if no context
    IF v_mode IS NULL THEN
      v_mode := 'user';
    END IF;
  END IF;

  -- Resolve role based on mode
  CASE v_mode
    WHEN 'mc' THEN
      -- Get MC role
      SELECT mcm.role INTO v_mc_role
      FROM management_company_members mcm
      WHERE mcm.user_id = p_user_id
        AND mcm.company_id = v_entity_id
        AND mcm.is_active = true;
      
      IF v_mc_role IS NULL THEN
        -- Not a member, fallback
        v_mode := 'user';
        v_role := 'user';
      ELSE
        v_role := v_mc_role;
        
        -- Resolve permissions from team_member_permissions
        SELECT array_agg(DISTINCT module) INTO v_permissions
        FROM team_member_permissions
        WHERE user_id = p_user_id
          AND company_id = v_entity_id
          AND can_view = true;
        
        -- Directors/admins get all permissions
        IF v_mc_role IN ('director', 'admin') THEN
          v_permissions := ARRAY['crm', 'finance', 'bookings', 'properties', 'team', 'reports', 'settings', 'operations', 'channels', 'messages', 'inventory', 'maintenance'];
        END IF;
      END IF;
      
    WHEN 'owner' THEN
      v_role := 'owner';
      v_permissions := ARRAY['properties', 'finance', 'reports'];
      
    WHEN 'admin' THEN
      IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role IN ('admin', 'uno_team')) THEN
        v_role := 'admin';
        v_permissions := ARRAY['*'];
      ELSE
        v_mode := 'user';
        v_role := 'user';
      END IF;
      
    WHEN 'vendor' THEN
      v_role := 'vendor';
      v_permissions := ARRAY['services', 'bookings', 'finance'];
      
    WHEN 'team' THEN
      IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role IN ('uno_team', 'admin')) THEN
        v_role := 'uno_team';
        v_permissions := ARRAY['*'];
      ELSE
        v_mode := 'user';
        v_role := 'user';
      END IF;
      
    ELSE
      v_role := 'user';
      v_permissions := ARRAY[]::text[];
  END CASE;

  RETURN jsonb_build_object(
    'mode', v_mode,
    'entity_id', v_entity_id,
    'role', v_role,
    'permissions', COALESCE(v_permissions, ARRAY[]::text[]),
    'resolved_at', now()
  );
END;
$$;
