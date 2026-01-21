-- Create vertical commission rules table
CREATE TABLE public.vertical_commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical TEXT NOT NULL UNIQUE,
  base_commission NUMERIC(5,2) NOT NULL DEFAULT 10,
  min_commission_amount NUMERIC(12,2),
  max_commission_amount NUMERIC(12,2),
  tiered_rates JSONB,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vertical_commission_rules ENABLE ROW LEVEL SECURITY;

-- Only admins and uno_team can manage commission rules
CREATE POLICY "Admins can manage commission rules"
ON public.vertical_commission_rules
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'uno_team')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'uno_team')
);

-- Add financial tracking columns to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vendor_payout_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_rate_applied NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS vertical TEXT;

-- Insert default commission rules for each vertical
INSERT INTO public.vertical_commission_rules (vertical, base_commission, notes) VALUES
('yacht', 12, 'Яхты и водный транспорт'),
('property', 10, 'Аренда недвижимости'),
('property_sale', 3, 'Продажа недвижимости'),
('tour', 15, 'Туры и экскурсии'),
('transport', 12, 'Транспортные услуги'),
('restaurant', 10, 'Рестораны и кафе'),
('spa', 12, 'Спа и велнес'),
('clinic', 10, 'Медицинские услуги'),
('event', 15, 'Мероприятия и билеты'),
('flower', 12, 'Цветы и подарки'),
('cleaning', 15, 'Клининг'),
('babysitter', 15, 'Няни и уход за детьми'),
('education', 12, 'Образование'),
('legal', 10, 'Юридические услуги'),
('insurance', 8, 'Страхование')
ON CONFLICT (vertical) DO NOTHING;

-- Create function to calculate commission on orders
CREATE OR REPLACE FUNCTION public.calculate_order_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_rate NUMERIC(5,2);
  v_provider_rate NUMERIC(5,2);
  v_vertical_rate NUMERIC(5,2);
  v_tiered_rates JSONB;
  v_provider_gmv NUMERIC;
  v_tier RECORD;
BEGIN
  -- Priority 1: Provider's individual rate
  SELECT commission_rate INTO v_provider_rate
  FROM providers
  WHERE id = NEW.provider_org_id;
  
  IF v_provider_rate IS NOT NULL AND v_provider_rate > 0 THEN
    v_commission_rate := v_provider_rate;
  ELSE
    -- Priority 2: Vertical rate with tiers
    SELECT base_commission, tiered_rates INTO v_vertical_rate, v_tiered_rates
    FROM vertical_commission_rules
    WHERE vertical = COALESCE(NEW.vertical, NEW.order_type)
    AND is_active = true;
    
    IF v_vertical_rate IS NOT NULL THEN
      -- Check if tiered rates apply
      IF v_tiered_rates IS NOT NULL AND jsonb_array_length(v_tiered_rates->'tiers') > 0 THEN
        -- Get provider's total GMV
        SELECT COALESCE(SUM(total_amount), 0) INTO v_provider_gmv
        FROM orders
        WHERE provider_org_id = NEW.provider_org_id
        AND status = 'completed';
        
        -- Find applicable tier
        FOR v_tier IN 
          SELECT * FROM jsonb_to_recordset(v_tiered_rates->'tiers') 
          AS x(min_gmv numeric, max_gmv numeric, rate numeric)
          ORDER BY min_gmv DESC
        LOOP
          IF v_provider_gmv >= v_tier.min_gmv AND (v_tier.max_gmv IS NULL OR v_provider_gmv < v_tier.max_gmv) THEN
            v_commission_rate := v_tier.rate;
            EXIT;
          END IF;
        END LOOP;
        
        IF v_commission_rate IS NULL THEN
          v_commission_rate := v_vertical_rate;
        END IF;
      ELSE
        v_commission_rate := v_vertical_rate;
      END IF;
    ELSE
      -- Priority 3: Default rate
      v_commission_rate := 10;
    END IF;
  END IF;
  
  -- Calculate amounts
  NEW.commission_rate_applied := v_commission_rate;
  NEW.platform_fee_amount := ROUND((NEW.total_amount * v_commission_rate / 100), 2);
  NEW.vendor_payout_amount := NEW.total_amount - NEW.platform_fee_amount;
  
  -- Set vertical if not set
  IF NEW.vertical IS NULL THEN
    NEW.vertical := NEW.order_type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new orders
DROP TRIGGER IF EXISTS calculate_order_commission_trigger ON orders;
CREATE TRIGGER calculate_order_commission_trigger
BEFORE INSERT OR UPDATE OF total_amount ON orders
FOR EACH ROW
EXECUTE FUNCTION calculate_order_commission();

-- Update existing orders with commission data
UPDATE orders
SET 
  commission_rate_applied = 10,
  platform_fee_amount = ROUND(total_amount * 0.10, 2),
  vendor_payout_amount = total_amount - ROUND(total_amount * 0.10, 2),
  vertical = order_type
WHERE platform_fee_amount = 0 OR platform_fee_amount IS NULL;

-- Create updated_at trigger for commission rules
DROP TRIGGER IF EXISTS update_vertical_commission_rules_updated_at ON vertical_commission_rules;
CREATE TRIGGER update_vertical_commission_rules_updated_at
BEFORE UPDATE ON vertical_commission_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();