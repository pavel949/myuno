CREATE OR REPLACE FUNCTION public.calculate_order_commission()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_commission_rate NUMERIC;
  v_provider_rate NUMERIC;
  v_vertical_rule RECORD;
  v_vertical TEXT;
BEGIN
  IF NEW.platform_fee_amount IS NOT NULL AND NEW.platform_fee_amount > 0 THEN RETURN NEW; END IF;
  IF NEW.total_amount IS NULL OR NEW.total_amount <= 0 THEN RETURN NEW; END IF;

  v_vertical := public.get_order_vertical(NEW.order_type, NEW.metadata);
  NEW.vertical := v_vertical;

  SELECT commission_rate INTO v_provider_rate FROM providers WHERE id = NEW.provider_org_id;

  IF v_provider_rate IS NOT NULL AND v_provider_rate > 0 THEN
    v_commission_rate := v_provider_rate / 100;
  ELSE
    SELECT * INTO v_vertical_rule FROM vertical_commission_rules
    WHERE vertical = v_vertical AND is_active = true;
    IF FOUND THEN
      IF v_vertical_rule.tiered_rates IS NOT NULL THEN
        SELECT rate INTO v_commission_rate
        FROM jsonb_to_recordset(v_vertical_rule.tiered_rates->'tiers')
          AS t(min_gmv NUMERIC, max_gmv NUMERIC, rate NUMERIC)
        WHERE NEW.total_amount >= min_gmv AND (max_gmv IS NULL OR NEW.total_amount < max_gmv)
        LIMIT 1;
      END IF;
      IF v_commission_rate IS NULL THEN v_commission_rate := v_vertical_rule.base_commission; END IF;
      -- Rules are stored as percent (10.00 = 10%); values <= 1 are legacy fractions.
      IF v_commission_rate > 1 THEN v_commission_rate := v_commission_rate / 100; END IF;
      IF v_vertical_rule.min_commission_amount IS NOT NULL THEN
        v_commission_rate := GREATEST(v_commission_rate, v_vertical_rule.min_commission_amount / NULLIF(NEW.total_amount, 0));
      END IF;
      IF v_vertical_rule.max_commission_amount IS NOT NULL THEN
        v_commission_rate := LEAST(v_commission_rate, v_vertical_rule.max_commission_amount / NULLIF(NEW.total_amount, 0));
      END IF;
    ELSE
      v_commission_rate := 0.10;
    END IF;
  END IF;

  v_commission_rate := LEAST(GREATEST(v_commission_rate, 0), 1);
  NEW.commission_rate_applied := v_commission_rate;
  NEW.platform_fee_amount := ROUND(NEW.total_amount * v_commission_rate, 2);
  NEW.vendor_payout_amount := NEW.total_amount - NEW.platform_fee_amount;
  RETURN NEW;
END;
$$;