-- Phase 2: Scale - iCal sync for yachts, dynamic pricing, deposit flow

-- 1. Create yacht_external_calendars table (mirrors property_external_calendars)
CREATE TABLE public.yacht_external_calendars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_id UUID NOT NULL REFERENCES public.yachts(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  ical_url TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.yacht_external_calendars ENABLE ROW LEVEL SECURITY;

-- RLS: Providers can manage their yacht calendars
CREATE POLICY "Providers can view their yacht calendars"
  ON public.yacht_external_calendars FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Providers can insert yacht calendars"
  ON public.yacht_external_calendars FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Providers can update their yacht calendars"
  ON public.yacht_external_calendars FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Providers can delete their yacht calendars"
  ON public.yacht_external_calendars FOR DELETE
  USING (owner_id = auth.uid());

-- 2. Create yacht_pricing_rules table for dynamic pricing
CREATE TABLE public.yacht_pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_id UUID NOT NULL REFERENCES public.yachts(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('season', 'day_of_week', 'special_event')),
  name_en TEXT NOT NULL,
  name_ru TEXT,
  start_date DATE,
  end_date DATE,
  days_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc.
  price_modifier_percent NUMERIC, -- e.g., 20 for +20%
  price_override_half_day NUMERIC,
  price_override_full_day NUMERIC,
  priority INTEGER DEFAULT 0, -- Higher priority rules override lower ones
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.yacht_pricing_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active pricing rules"
  ON public.yacht_pricing_rules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Yacht owners can manage pricing rules"
  ON public.yacht_pricing_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.yachts y
      JOIN public.providers p ON y.provider_id = p.id
      WHERE y.id = yacht_id AND p.user_id = auth.uid()
    )
  );

-- 3. Add deposit fields to order_item_yacht_details
ALTER TABLE public.order_item_yacht_details 
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS deposit_percent NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS balance_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS balance_paid_at TIMESTAMPTZ;

-- 4. Create function to calculate yacht price for a date
CREATE OR REPLACE FUNCTION public.get_yacht_price_for_date(
  p_yacht_id UUID,
  p_date DATE,
  p_charter_type TEXT DEFAULT 'full_day'
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_base_price NUMERIC;
  v_final_price NUMERIC;
  v_rule RECORD;
  v_day_of_week INTEGER;
BEGIN
  -- Get base price
  IF p_charter_type = 'half_day' THEN
    SELECT COALESCE(price_half_day, 0) INTO v_base_price FROM yachts WHERE id = p_yacht_id;
  ELSE
    SELECT COALESCE(price_full_day, 0) INTO v_base_price FROM yachts WHERE id = p_yacht_id;
  END IF;
  
  v_final_price := v_base_price;
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Check for date-specific override in yacht_availability
  SELECT price_override INTO v_final_price
  FROM yacht_availability
  WHERE yacht_id = p_yacht_id AND date = p_date AND price_override IS NOT NULL;
  
  IF v_final_price IS NOT NULL AND v_final_price > 0 THEN
    RETURN v_final_price;
  END IF;
  
  v_final_price := v_base_price;
  
  -- Apply pricing rules (highest priority first)
  FOR v_rule IN
    SELECT * FROM yacht_pricing_rules
    WHERE yacht_id = p_yacht_id
      AND is_active = true
      AND (
        (rule_type = 'season' AND p_date BETWEEN start_date AND end_date)
        OR (rule_type = 'day_of_week' AND v_day_of_week = ANY(days_of_week))
        OR (rule_type = 'special_event' AND p_date BETWEEN start_date AND end_date)
      )
    ORDER BY priority DESC, rule_type = 'special_event' DESC, rule_type = 'season' DESC
    LIMIT 1
  LOOP
    -- Apply modifier
    IF p_charter_type = 'half_day' AND v_rule.price_override_half_day IS NOT NULL THEN
      v_final_price := v_rule.price_override_half_day;
    ELSIF p_charter_type = 'full_day' AND v_rule.price_override_full_day IS NOT NULL THEN
      v_final_price := v_rule.price_override_full_day;
    ELSIF v_rule.price_modifier_percent IS NOT NULL THEN
      v_final_price := v_base_price * (1 + v_rule.price_modifier_percent / 100);
    END IF;
  END LOOP;
  
  RETURN ROUND(v_final_price, 2);
END;
$$;

-- 5. Add updated_at trigger for new tables
CREATE TRIGGER update_yacht_external_calendars_updated_at
  BEFORE UPDATE ON public.yacht_external_calendars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_yacht_pricing_rules_updated_at
  BEFORE UPDATE ON public.yacht_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 6. Add index for faster calendar lookups
CREATE INDEX IF NOT EXISTS idx_yacht_external_calendars_yacht ON public.yacht_external_calendars(yacht_id);
CREATE INDEX IF NOT EXISTS idx_yacht_pricing_rules_yacht ON public.yacht_pricing_rules(yacht_id);
CREATE INDEX IF NOT EXISTS idx_yacht_pricing_rules_dates ON public.yacht_pricing_rules(start_date, end_date) WHERE is_active = true;

-- 7. Generate iCal token for yachts if column exists
UPDATE public.yachts 
SET ical_token = encode(gen_random_bytes(32), 'hex')
WHERE ical_token IS NULL;