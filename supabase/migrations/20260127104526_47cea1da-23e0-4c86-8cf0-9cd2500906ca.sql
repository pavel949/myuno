-- =============================================
-- P1-3: SOFT DELETE RLS POLICIES FOR ORDERS
-- =============================================

-- Drop existing policies to recreate with soft delete logic
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_own" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_select_all" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;

-- Users see only their non-deleted orders
CREATE POLICY "orders_select_own" ON public.orders
FOR SELECT USING (
  customer_user_id = auth.uid() 
  AND deleted_at IS NULL
);

-- Users can create orders for themselves
CREATE POLICY "orders_insert_own" ON public.orders
FOR INSERT WITH CHECK (
  customer_user_id = auth.uid()
);

-- Users can update their own non-deleted orders
CREATE POLICY "orders_update_own" ON public.orders
FOR UPDATE USING (
  customer_user_id = auth.uid() 
  AND deleted_at IS NULL
);

-- Admins can view ALL orders including soft-deleted (for audit)
CREATE POLICY "orders_admin_select_all" ON public.orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Admins can update any order (including soft-delete)
CREATE POLICY "orders_admin_update" ON public.orders
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Function to soft delete an order (admin only)
CREATE OR REPLACE FUNCTION public.soft_delete_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can delete orders';
  END IF;
  
  UPDATE orders
  SET 
    deleted_at = now(),
    deleted_by = auth.uid(),
    updated_at = now()
  WHERE id = p_order_id
    AND deleted_at IS NULL;
  
  INSERT INTO order_status_history (order_id, to_status, actor_user_id, reason)
  SELECT id, status, auth.uid(), 'Soft deleted by admin'
  FROM orders WHERE id = p_order_id;
  
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.soft_delete_order TO authenticated;

-- =============================================
-- P1-2: iCal TOKEN VALIDATION WITH EXPIRATION
-- =============================================

CREATE OR REPLACE FUNCTION public.validate_ical_token(
  p_property_id UUID,
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_property RECORD;
BEGIN
  SELECT id, ical_token, ical_token_expires_at, owner_id
  INTO v_property
  FROM owner_properties
  WHERE id = p_property_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'property_not_found');
  END IF;
  
  IF v_property.ical_token IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'no_token_configured');
  END IF;
  
  IF v_property.ical_token != p_token THEN
    RETURN jsonb_build_object('valid', false, 'error', 'invalid_token');
  END IF;
  
  IF v_property.ical_token_expires_at IS NOT NULL AND v_property.ical_token_expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'token_expired');
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true, 
    'property_id', v_property.id,
    'owner_id', v_property.owner_id
  );
END;
$$;

-- Rotate token function with owner/admin check
CREATE OR REPLACE FUNCTION public.rotate_ical_token(p_property_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_token TEXT;
  v_owner_id UUID;
BEGIN
  SELECT owner_id INTO v_owner_id
  FROM owner_properties
  WHERE id = p_property_id;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Property not found';
  END IF;
  
  IF v_owner_id != auth.uid() THEN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin') THEN
      RAISE EXCEPTION 'Only property owner or admin can rotate token';
    END IF;
  END IF;
  
  v_new_token := encode(gen_random_bytes(32), 'hex');
  
  UPDATE owner_properties
  SET 
    ical_token = v_new_token,
    ical_token_expires_at = now() + INTERVAL '1 year',
    ical_token_refreshed_at = now(),
    updated_at = now()
  WHERE id = p_property_id;
  
  RETURN v_new_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rotate_ical_token TO authenticated;