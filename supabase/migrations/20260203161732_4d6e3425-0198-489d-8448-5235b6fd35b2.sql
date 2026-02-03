-- =====================================================
-- P0 FIX 1: Atomic wallet topup (eliminates race condition)
-- =====================================================
CREATE OR REPLACE FUNCTION public.topup_wallet_atomic(
  p_user_id uuid,
  p_amount numeric,
  p_reference_type text,
  p_reference_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet_id UUID;
  v_new_balance NUMERIC;
  v_currency TEXT;
  v_transaction_id UUID;
BEGIN
  -- Lock row and update atomically in single statement
  UPDATE public.wallets
  SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING id, balance, currency INTO v_wallet_id, v_new_balance, v_currency;
  
  -- If wallet doesn't exist, create it
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.wallets (user_id, balance, currency)
    VALUES (p_user_id, p_amount, 'THB')
    RETURNING id, balance, currency INTO v_wallet_id, v_new_balance, v_currency;
  END IF;
  
  -- Insert transaction record atomically
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, currency,
    description, description_ru,
    reference_type, reference_id, status
  ) VALUES (
    v_wallet_id, p_user_id, 'topup', p_amount, v_currency,
    'Wallet top up via Stripe', 'Пополнение кошелька через Stripe',
    p_reference_type, p_reference_id, 'completed'
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'wallet_id', v_wallet_id,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id
  );
END;
$$;

-- =====================================================
-- P0 FIX 2: Atomic order creation (eliminates zombie records)
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order_type text,
  p_customer_user_id uuid,
  p_provider_org_id uuid DEFAULT NULL,
  p_start_at timestamptz DEFAULT NULL,
  p_end_at timestamptz DEFAULT NULL,
  p_total_amount numeric DEFAULT 0,
  p_currency text DEFAULT 'THB',
  p_notes text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_participants jsonb DEFAULT NULL,
  p_addresses jsonb DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_payment_amount numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_participant JSONB;
  v_address JSONB;
BEGIN
  -- Create order
  INSERT INTO public.orders (
    order_type, customer_user_id, provider_org_id,
    status, start_at, end_at, total_amount, currency, notes, metadata
  ) VALUES (
    p_order_type, p_customer_user_id, p_provider_org_id,
    'pending', p_start_at, p_end_at, p_total_amount, p_currency, p_notes, p_metadata
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;
  
  -- Insert items
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO public.order_items (
        order_id, product_id, resource_id, provider_org_id,
        item_name, item_type, qty, unit_price, amount, 
        start_at, end_at, metadata
      ) VALUES (
        v_order_id,
        NULLIF(v_item->>'product_id', '')::uuid,
        NULLIF(v_item->>'resource_id', '')::uuid,
        COALESCE(NULLIF(v_item->>'provider_org_id', '')::uuid, p_provider_org_id),
        v_item->>'item_name',
        COALESCE(v_item->>'item_type', 'service'),
        COALESCE((v_item->>'qty')::int, 1),
        COALESCE((v_item->>'unit_price')::numeric, 0),
        COALESCE((v_item->>'amount')::numeric, 0),
        NULLIF(v_item->>'start_at', '')::timestamptz,
        NULLIF(v_item->>'end_at', '')::timestamptz,
        COALESCE(v_item->'metadata', '{}'::jsonb)
      );
    END LOOP;
  END IF;
  
  -- Insert participants
  IF p_participants IS NOT NULL AND jsonb_array_length(p_participants) > 0 THEN
    FOR v_participant IN SELECT * FROM jsonb_array_elements(p_participants)
    LOOP
      INSERT INTO public.order_participants (
        order_id, role, name, phone, email
      ) VALUES (
        v_order_id,
        COALESCE(v_participant->>'role', 'primary'),
        v_participant->>'name',
        v_participant->>'phone',
        v_participant->>'email'
      );
    END LOOP;
  END IF;
  
  -- Insert addresses
  IF p_addresses IS NOT NULL AND jsonb_array_length(p_addresses) > 0 THEN
    FOR v_address IN SELECT * FROM jsonb_array_elements(p_addresses)
    LOOP
      INSERT INTO public.order_addresses (
        order_id, address_type, address_text, lat, lng, notes
      ) VALUES (
        v_order_id,
        v_address->>'address_type',
        v_address->>'address_text',
        NULLIF(v_address->>'lat', '')::numeric,
        NULLIF(v_address->>'lng', '')::numeric,
        v_address->>'notes'
      );
    END LOOP;
  END IF;
  
  -- Create payment intent if provided
  IF p_payment_method IS NOT NULL AND p_payment_amount IS NOT NULL THEN
    INSERT INTO public.payment_intents (
      order_id, amount, currency, method, status
    ) VALUES (
      v_order_id, p_payment_amount, p_currency, p_payment_method, 'pending'
    );
  END IF;
  
  -- Record initial status in history
  INSERT INTO public.order_status_history (
    order_id, from_status, to_status, actor_user_id, reason
  ) VALUES (
    v_order_id, NULL, 'pending', p_customer_user_id, 'Order created'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Transaction will be rolled back automatically
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- =====================================================
-- P1 FIX: Unified elevated access check function
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_elevated_access(
  p_required_roles text[] DEFAULT ARRAY['admin', 'uno_team']
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
BEGIN
  -- Check user_roles table
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role = ANY(p_required_roles)
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check org_members for admin/owner role in any org (gives elevated privileges)
  IF EXISTS (
    SELECT 1 FROM public.org_members om
    JOIN public.orgs o ON o.id = om.org_id
    WHERE om.user_id = auth.uid() 
      AND om.is_active = TRUE
      AND om.role IN ('owner', 'admin')
      AND o.is_active = TRUE
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- =====================================================
-- P0 FIX 3: Restrict analytics RLS policies to admin only
-- =====================================================

-- cohort_analytics
DROP POLICY IF EXISTS "cohort_read" ON public.cohort_analytics;
DROP POLICY IF EXISTS "Anyone can read cohort analytics" ON public.cohort_analytics;
DROP POLICY IF EXISTS "analytics_admin_access" ON public.cohort_analytics;

CREATE POLICY "analytics_admin_only" ON public.cohort_analytics 
FOR ALL TO authenticated 
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());

-- funnel_analytics  
DROP POLICY IF EXISTS "funnel_read" ON public.funnel_analytics;
DROP POLICY IF EXISTS "Anyone can read funnel analytics" ON public.funnel_analytics;
DROP POLICY IF EXISTS "analytics_admin_access" ON public.funnel_analytics;

CREATE POLICY "analytics_admin_only" ON public.funnel_analytics 
FOR ALL TO authenticated 
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());

-- user_analytics_daily
DROP POLICY IF EXISTS "daily_read" ON public.user_analytics_daily;
DROP POLICY IF EXISTS "Anyone can read user analytics daily" ON public.user_analytics_daily;
DROP POLICY IF EXISTS "analytics_admin_access" ON public.user_analytics_daily;

CREATE POLICY "analytics_admin_only" ON public.user_analytics_daily 
FOR ALL TO authenticated 
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());

-- user_segments
DROP POLICY IF EXISTS "segments_read" ON public.user_segments;
DROP POLICY IF EXISTS "Anyone can read user segments" ON public.user_segments;
DROP POLICY IF EXISTS "analytics_admin_access" ON public.user_segments;

CREATE POLICY "analytics_admin_only" ON public.user_segments 
FOR ALL TO authenticated 
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());

-- admin_audit_logs (also should be restricted)
DROP POLICY IF EXISTS "admin_audit_logs_admin_access" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;

CREATE POLICY "audit_logs_admin_only" ON public.admin_audit_logs
FOR ALL TO authenticated
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());