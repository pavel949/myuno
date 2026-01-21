-- Phase 2: Financial Accuracy

-- 1. Create function to calculate cashback for an order
CREATE OR REPLACE FUNCTION public.calculate_order_cashback(
  p_order_id UUID,
  p_category TEXT DEFAULT 'default'
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_settings RECORD;
  v_cashback_amount NUMERIC := 0;
BEGIN
  -- Get order details
  SELECT total_amount, currency INTO v_order
  FROM orders
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Get cashback settings for category (or default)
  SELECT * INTO v_settings
  FROM cashback_settings
  WHERE (category = p_category OR category = 'default')
    AND is_active = true
  ORDER BY CASE WHEN category = p_category THEN 0 ELSE 1 END
  LIMIT 1;
  
  IF NOT FOUND OR v_settings.percentage <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Check minimum order amount
  IF v_settings.min_order_amount IS NOT NULL AND v_order.total_amount < v_settings.min_order_amount THEN
    RETURN 0;
  END IF;
  
  -- Calculate cashback
  v_cashback_amount := ROUND(v_order.total_amount * v_settings.percentage / 100, 2);
  
  -- Apply max cashback limit
  IF v_settings.max_cashback_amount IS NOT NULL AND v_cashback_amount > v_settings.max_cashback_amount THEN
    v_cashback_amount := v_settings.max_cashback_amount;
  END IF;
  
  RETURN v_cashback_amount;
END;
$$;

-- 2. Create function to get subscription revenue (actual prices from plans)
CREATE OR REPLACE FUNCTION public.get_subscription_revenue(p_days INT DEFAULT 30)
RETURNS TABLE(
  total_revenue NUMERIC,
  active_count INT,
  monthly_count INT,
  yearly_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN vs.billing_cycle = 'yearly' THEN COALESCE(sp.price_yearly, 0) / 12
        ELSE COALESCE(sp.price_monthly, 0)
      END
    ), 0::NUMERIC) AS total_revenue,
    COUNT(*)::INT AS active_count,
    COUNT(*) FILTER (WHERE vs.billing_cycle = 'monthly')::INT AS monthly_count,
    COUNT(*) FILTER (WHERE vs.billing_cycle = 'yearly')::INT AS yearly_count
  FROM vendor_subscriptions vs
  LEFT JOIN subscription_plans sp ON vs.plan_id = sp.id
  WHERE vs.status = 'active';
END;
$$;

-- 3. Create utility function for calculating order total with fees
CREATE OR REPLACE FUNCTION public.calculate_order_totals(
  p_base_amount NUMERIC,
  p_vertical TEXT DEFAULT 'service',
  p_provider_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_rate NUMERIC := 0.10; -- default 10%
  v_provider_rate NUMERIC;
  v_vertical_rule RECORD;
  v_platform_fee NUMERIC;
  v_vendor_amount NUMERIC;
  v_service_fee NUMERIC := 0; -- optional customer service fee
BEGIN
  -- 1. Check provider-specific rate
  IF p_provider_id IS NOT NULL THEN
    SELECT commission_rate INTO v_provider_rate
    FROM providers
    WHERE id = p_provider_id;
    
    IF v_provider_rate IS NOT NULL AND v_provider_rate > 0 THEN
      v_commission_rate := v_provider_rate / 100;
    END IF;
  END IF;
  
  -- 2. If no provider rate, check vertical rules
  IF v_provider_rate IS NULL OR v_provider_rate = 0 THEN
    SELECT * INTO v_vertical_rule
    FROM vertical_commission_rules
    WHERE vertical = p_vertical AND is_active = true;
    
    IF FOUND THEN
      -- Check for tiered rates
      IF v_vertical_rule.tiered_rates IS NOT NULL THEN
        SELECT rate INTO v_commission_rate
        FROM jsonb_to_recordset(v_vertical_rule.tiered_rates->'tiers') 
          AS t(min_gmv NUMERIC, max_gmv NUMERIC, rate NUMERIC)
        WHERE p_base_amount >= min_gmv 
          AND (max_gmv IS NULL OR p_base_amount < max_gmv)
        LIMIT 1;
      END IF;
      
      IF v_commission_rate IS NULL OR v_commission_rate = 0 THEN
        v_commission_rate := COALESCE(v_vertical_rule.base_commission, 0.10);
      END IF;
    END IF;
  END IF;
  
  -- Calculate fees
  v_platform_fee := ROUND(p_base_amount * v_commission_rate, 2);
  v_vendor_amount := p_base_amount - v_platform_fee;
  
  -- Return all calculated values
  RETURN json_build_object(
    'base_amount', p_base_amount,
    'commission_rate', v_commission_rate,
    'platform_fee', v_platform_fee,
    'vendor_amount', v_vendor_amount,
    'service_fee', v_service_fee,
    'total_customer_pays', p_base_amount + v_service_fee
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.calculate_order_cashback TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_revenue TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_order_totals TO authenticated;