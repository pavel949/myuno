-- Add commission_rate field to product/service tables
-- NULL = use provider rate or vertical rule

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT NULL;
COMMENT ON COLUMN public.services.commission_rate IS 'Custom commission rate for this service (0-1). NULL = use provider/vertical rate.';

ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT NULL;
COMMENT ON COLUMN public.tours.commission_rate IS 'Custom commission rate for this tour (0-1). NULL = use provider/vertical rate.';

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT NULL;
COMMENT ON COLUMN public.properties.commission_rate IS 'Custom commission rate for this property (0-1). NULL = use provider/vertical rate.';

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT NULL;
COMMENT ON COLUMN public.vehicles.commission_rate IS 'Custom commission rate for this vehicle (0-1). NULL = use provider/vertical rate.';

ALTER TABLE public.marketplace_products ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT NULL;
COMMENT ON COLUMN public.marketplace_products.commission_rate IS 'Custom commission rate for this product (0-1). NULL = use provider/vertical rate.';

-- Create helper function to get product-specific commission
CREATE OR REPLACE FUNCTION public.get_product_commission(
  p_product_id UUID,
  p_vertical TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate NUMERIC;
BEGIN
  -- Check based on vertical type
  CASE p_vertical
    WHEN 'service' THEN
      SELECT commission_rate INTO v_rate FROM services WHERE id = p_product_id;
    WHEN 'tour' THEN
      SELECT commission_rate INTO v_rate FROM tours WHERE id = p_product_id;
    WHEN 'property' THEN
      SELECT commission_rate INTO v_rate FROM properties WHERE id = p_product_id;
    WHEN 'vehicle', 'transfer' THEN
      SELECT commission_rate INTO v_rate FROM vehicles WHERE id = p_product_id;
    WHEN 'marketplace' THEN
      SELECT commission_rate INTO v_rate FROM marketplace_products WHERE id = p_product_id;
    ELSE
      v_rate := NULL;
  END CASE;
  
  RETURN v_rate;
END;
$$;

-- Update calculate_order_totals to use product-level commission
CREATE OR REPLACE FUNCTION public.calculate_order_totals(
  p_base_amount NUMERIC,
  p_vertical TEXT DEFAULT 'service',
  p_provider_id UUID DEFAULT NULL,
  p_product_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_rate NUMERIC := 0.10; -- Default 10%
  v_platform_fee NUMERIC;
  v_vendor_amount NUMERIC;
  v_service_fee NUMERIC := 0;
  v_total_customer_pays NUMERIC;
  v_product_rate NUMERIC;
  v_provider_rate NUMERIC;
  v_vertical_rule RECORD;
BEGIN
  -- 1. Check product-specific rate (NEW - highest priority)
  IF p_product_id IS NOT NULL THEN
    v_product_rate := get_product_commission(p_product_id, p_vertical);
    IF v_product_rate IS NOT NULL THEN
      v_commission_rate := v_product_rate;
    END IF;
  END IF;
  
  -- 2. Check provider custom rate (if no product rate)
  IF v_product_rate IS NULL AND p_provider_id IS NOT NULL THEN
    SELECT commission_rate INTO v_provider_rate
    FROM providers
    WHERE id = p_provider_id;
    
    IF v_provider_rate IS NOT NULL THEN
      v_commission_rate := v_provider_rate / 100; -- Convert from percentage
    END IF;
  END IF;
  
  -- 3. Check vertical rules (if no provider rate)
  IF v_product_rate IS NULL AND v_provider_rate IS NULL THEN
    SELECT * INTO v_vertical_rule
    FROM vertical_commission_rules
    WHERE vertical = p_vertical AND is_active = true;
    
    IF v_vertical_rule.base_commission IS NOT NULL THEN
      v_commission_rate := v_vertical_rule.base_commission / 100;
    END IF;
  END IF;
  
  -- Calculate platform fee
  v_platform_fee := ROUND(p_base_amount * v_commission_rate, 2);
  
  -- Apply min/max caps from vertical rules if applicable
  IF v_vertical_rule IS NOT NULL THEN
    IF v_vertical_rule.min_commission_amount IS NOT NULL AND v_platform_fee < v_vertical_rule.min_commission_amount THEN
      v_platform_fee := v_vertical_rule.min_commission_amount;
    END IF;
    IF v_vertical_rule.max_commission_amount IS NOT NULL AND v_platform_fee > v_vertical_rule.max_commission_amount THEN
      v_platform_fee := v_vertical_rule.max_commission_amount;
    END IF;
  END IF;
  
  -- Calculate vendor amount
  v_vendor_amount := p_base_amount - v_platform_fee;
  
  -- Total customer pays (no additional service fee for now)
  v_total_customer_pays := p_base_amount;
  
  RETURN json_build_object(
    'base_amount', p_base_amount,
    'commission_rate', v_commission_rate,
    'platform_fee', v_platform_fee,
    'vendor_amount', v_vendor_amount,
    'service_fee', v_service_fee,
    'total_customer_pays', v_total_customer_pays
  );
END;
$$;