
-- Fix the set_review_verified_status function to handle UUID properly
CREATE OR REPLACE FUNCTION public.set_review_verified_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to verify if user has a completed booking for this item
  -- Handle potential type mismatches gracefully
  BEGIN
    NEW.is_verified_purchase := EXISTS (
      SELECT 1 FROM orders o
      WHERE o.customer_user_id = NEW.user_id
        AND o.status IN ('completed', 'confirmed', 'delivered')
        AND o.vertical = NEW.item_type
    );
  EXCEPTION WHEN OTHERS THEN
    NEW.is_verified_purchase := false;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
