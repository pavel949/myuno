-- Create cashback settings table
CREATE TABLE public.cashback_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL DEFAULT 'default',
  percentage numeric NOT NULL DEFAULT 5 CHECK (percentage >= 0 AND percentage <= 100),
  min_order_amount numeric DEFAULT 0,
  max_cashback_amount numeric DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default cashback rate (5%)
INSERT INTO public.cashback_settings (category, percentage, min_order_amount, is_active)
VALUES 
  ('default', 5, 100, true),
  ('beauty', 7, 500, true),
  ('food', 3, 200, true),
  ('property', 2, 5000, true);

-- Enable RLS
ALTER TABLE public.cashback_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active cashback settings
CREATE POLICY "Anyone can view active cashback settings"
ON public.cashback_settings
FOR SELECT
USING (is_active = true);

-- Create function to process cashback on booking completion
CREATE OR REPLACE FUNCTION public.process_cashback_on_booking_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cashback_percentage numeric;
  v_cashback_amount numeric;
  v_wallet_id uuid;
  v_min_order numeric;
  v_max_cashback numeric;
  v_booking_type text;
BEGIN
  -- Only process if status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Skip if no total amount
    IF NEW.total_amount IS NULL OR NEW.total_amount <= 0 THEN
      RETURN NEW;
    END IF;

    -- Get booking type for category-specific cashback
    v_booking_type := NEW.booking_type::text;
    
    -- Get cashback settings (category-specific or default)
    SELECT percentage, min_order_amount, max_cashback_amount
    INTO v_cashback_percentage, v_min_order, v_max_cashback
    FROM public.cashback_settings
    WHERE is_active = true AND (category = v_booking_type OR category = 'default')
    ORDER BY CASE WHEN category = v_booking_type THEN 0 ELSE 1 END
    LIMIT 1;
    
    -- Use default 5% if no settings found
    IF v_cashback_percentage IS NULL THEN
      v_cashback_percentage := 5;
      v_min_order := 0;
    END IF;
    
    -- Check minimum order amount
    IF NEW.total_amount < COALESCE(v_min_order, 0) THEN
      RETURN NEW;
    END IF;
    
    -- Calculate cashback amount
    v_cashback_amount := ROUND((NEW.total_amount * v_cashback_percentage / 100), 2);
    
    -- Apply max cashback limit if set
    IF v_max_cashback IS NOT NULL AND v_cashback_amount > v_max_cashback THEN
      v_cashback_amount := v_max_cashback;
    END IF;
    
    -- Skip if cashback is 0 or negative
    IF v_cashback_amount <= 0 THEN
      RETURN NEW;
    END IF;
    
    -- Get or create wallet
    SELECT id INTO v_wallet_id
    FROM public.wallets
    WHERE user_id = NEW.user_id;
    
    IF v_wallet_id IS NULL THEN
      INSERT INTO public.wallets (user_id, balance, currency)
      VALUES (NEW.user_id, 0, 'RUB')
      RETURNING id INTO v_wallet_id;
    END IF;
    
    -- Update wallet balance
    UPDATE public.wallets
    SET balance = balance + v_cashback_amount,
        updated_at = now()
    WHERE id = v_wallet_id;
    
    -- Create transaction record
    INSERT INTO public.wallet_transactions (
      wallet_id,
      user_id,
      type,
      amount,
      currency,
      description,
      description_ru,
      reference_type,
      reference_id,
      status
    ) VALUES (
      v_wallet_id,
      NEW.user_id,
      'cashback',
      v_cashback_amount,
      'RUB',
      'Cashback ' || v_cashback_percentage || '% for booking #' || LEFT(NEW.id::text, 8),
      'Кэшбэк ' || v_cashback_percentage || '% за бронирование #' || LEFT(NEW.id::text, 8),
      'booking',
      NEW.id::text,
      'completed'
    );
    
    -- Create notification about cashback
    INSERT INTO public.notifications (
      user_id,
      title,
      body,
      type,
      data,
      is_read
    ) VALUES (
      NEW.user_id,
      '💰 Кэшбэк начислен!',
      'Вам начислено ' || v_cashback_amount || ' ₽ кэшбэка (' || v_cashback_percentage || '%) за завершённое бронирование.',
      'cashback',
      jsonb_build_object(
        'amount', v_cashback_amount,
        'percentage', v_cashback_percentage,
        'booking_id', NEW.id
      ),
      false
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for cashback processing
CREATE TRIGGER trigger_process_cashback
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.process_cashback_on_booking_complete();

-- Also trigger on insert in case booking is created with 'completed' status
CREATE TRIGGER trigger_process_cashback_on_insert
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.process_cashback_on_booking_complete();