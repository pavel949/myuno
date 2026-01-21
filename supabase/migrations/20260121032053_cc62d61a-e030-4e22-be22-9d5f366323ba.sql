-- Phase 1: Critical Fixes

-- 1. Create atomic payout processing function
CREATE OR REPLACE FUNCTION public.process_payout(
  p_payout_id UUID,
  p_new_status TEXT,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout RECORD;
  v_provider RECORD;
  v_new_pending NUMERIC;
BEGIN
  -- Get payout details with lock
  SELECT * INTO v_payout 
  FROM vendor_payouts 
  WHERE id = p_payout_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Payout not found');
  END IF;
  
  -- Validate status transition
  IF v_payout.status NOT IN ('pending', 'processing') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid payout status for processing');
  END IF;
  
  IF p_new_status NOT IN ('completed', 'failed') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid target status');
  END IF;
  
  -- Update payout status
  UPDATE vendor_payouts
  SET 
    status = p_new_status,
    processed_at = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE processed_at END,
    payment_reference = COALESCE(p_payment_reference, payment_reference)
  WHERE id = p_payout_id;
  
  -- If completed, atomically update provider balance
  IF p_new_status = 'completed' THEN
    -- Get provider with lock
    SELECT * INTO v_provider 
    FROM providers 
    WHERE id = v_payout.provider_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Provider not found');
    END IF;
    
    -- Calculate new pending amount (never go negative)
    v_new_pending := GREATEST(0, COALESCE(v_provider.pending_payout, 0) - v_payout.amount);
    
    -- Update provider balance
    UPDATE providers
    SET 
      pending_payout = v_new_pending,
      updated_at = NOW()
    WHERE id = v_payout.provider_id;
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'payout_id', p_payout_id,
    'new_status', p_new_status
  );
END;
$$;

-- 2. Sync vertical keys - add missing verticals to commission rules
INSERT INTO vertical_commission_rules (vertical, base_commission, notes, is_active)
VALUES 
  ('restaurant', 0.12, 'Restaurant bookings - synced with food vertical', true),
  ('spa', 0.15, 'Spa and wellness services', true),
  ('clinic', 0.10, 'Medical clinic services', true),
  ('legal', 0.08, 'Legal services', true),
  ('insurance', 0.10, 'Insurance services', true),
  ('water_activity', 0.15, 'Water activities', true),
  ('transfer', 0.10, 'Airport transfers', true)
ON CONFLICT (vertical) DO NOTHING;

-- 3. Create function to get proper vertical from order metadata
CREATE OR REPLACE FUNCTION public.get_order_vertical(p_order_type TEXT, p_metadata JSONB)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Map order types to financial verticals
  RETURN CASE p_order_type
    WHEN 'food' THEN 'restaurant'
    WHEN 'vehicle' THEN COALESCE(p_metadata->>'vehicle_type', 'vehicle')
    ELSE p_order_type
  END;
END;
$$;

-- 4. Update calculate_order_commission to use proper vertical mapping
CREATE OR REPLACE FUNCTION public.calculate_order_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_rate NUMERIC;
  v_provider_rate NUMERIC;
  v_vertical_rule RECORD;
  v_vertical TEXT;
BEGIN
  -- Skip if already calculated or no amount
  IF NEW.platform_fee_amount IS NOT NULL AND NEW.platform_fee_amount > 0 THEN
    RETURN NEW;
  END IF;
  
  IF NEW.total_amount IS NULL OR NEW.total_amount <= 0 THEN
    RETURN NEW;
  END IF;
  
  -- Get proper vertical
  v_vertical := public.get_order_vertical(NEW.order_type, NEW.metadata);
  NEW.vertical := v_vertical;
  
  -- 1. Try provider-specific rate first
  SELECT commission_rate INTO v_provider_rate
  FROM providers
  WHERE id = NEW.provider_org_id;
  
  IF v_provider_rate IS NOT NULL AND v_provider_rate > 0 THEN
    v_commission_rate := v_provider_rate / 100;
  ELSE
    -- 2. Try vertical-specific rule
    SELECT * INTO v_vertical_rule
    FROM vertical_commission_rules
    WHERE vertical = v_vertical AND is_active = true;
    
    IF FOUND THEN
      -- Check for tiered rates
      IF v_vertical_rule.tiered_rates IS NOT NULL THEN
        SELECT rate INTO v_commission_rate
        FROM jsonb_to_recordset(v_vertical_rule.tiered_rates->'tiers') 
          AS t(min_gmv NUMERIC, max_gmv NUMERIC, rate NUMERIC)
        WHERE NEW.total_amount >= min_gmv 
          AND (max_gmv IS NULL OR NEW.total_amount < max_gmv)
        LIMIT 1;
      END IF;
      
      IF v_commission_rate IS NULL THEN
        v_commission_rate := v_vertical_rule.base_commission;
      END IF;
      
      -- Apply min/max constraints
      IF v_vertical_rule.min_commission_amount IS NOT NULL THEN
        v_commission_rate := GREATEST(
          v_commission_rate,
          v_vertical_rule.min_commission_amount / NULLIF(NEW.total_amount, 0)
        );
      END IF;
      
      IF v_vertical_rule.max_commission_amount IS NOT NULL THEN
        v_commission_rate := LEAST(
          v_commission_rate,
          v_vertical_rule.max_commission_amount / NULLIF(NEW.total_amount, 0)
        );
      END IF;
    ELSE
      -- 3. Default rate
      v_commission_rate := 0.10;
    END IF;
  END IF;
  
  -- Calculate amounts
  NEW.commission_rate_applied := v_commission_rate;
  NEW.platform_fee_amount := ROUND(NEW.total_amount * v_commission_rate, 2);
  NEW.vendor_payout_amount := NEW.total_amount - NEW.platform_fee_amount;
  
  RETURN NEW;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.process_payout TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_vertical TO authenticated;