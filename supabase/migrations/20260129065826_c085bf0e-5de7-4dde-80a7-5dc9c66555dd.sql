
-- Fix the trigger function to use correct column name
CREATE OR REPLACE FUNCTION public.trigger_recalc_segment_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Use customer_user_id instead of customer_id
  PERFORM recalculate_user_segment(NEW.customer_user_id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail order creation if segment calc fails
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
