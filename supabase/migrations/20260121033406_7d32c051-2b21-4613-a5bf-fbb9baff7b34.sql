-- Phase 4: Feature Parity - Database enhancements

-- 1. Add restaurant_availability table for dynamic slot management
CREATE TABLE IF NOT EXISTS public.restaurant_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  max_covers INTEGER NOT NULL DEFAULT 20,
  booked_covers INTEGER NOT NULL DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, date, time_slot)
);

-- Enable RLS
ALTER TABLE public.restaurant_availability ENABLE ROW LEVEL SECURITY;

-- Anyone can read availability
CREATE POLICY "Anyone can read restaurant availability" 
  ON public.restaurant_availability FOR SELECT 
  USING (true);

-- Providers can manage their restaurant availability
CREATE POLICY "Providers can manage their restaurant availability" 
  ON public.restaurant_availability FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM restaurants r 
      JOIN providers p ON r.provider_id = p.id 
      WHERE r.id = restaurant_id AND p.user_id = auth.uid()
    )
  );

-- 2. Add realtime support for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;

-- 3. Function to check restaurant availability
CREATE OR REPLACE FUNCTION check_restaurant_availability(
  p_restaurant_id UUID,
  p_date DATE,
  p_time TIME,
  p_covers INTEGER DEFAULT 2
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot RECORD;
  v_available_covers INTEGER;
BEGIN
  -- Check if there's a specific slot entry
  SELECT * INTO v_slot
  FROM restaurant_availability
  WHERE restaurant_id = p_restaurant_id
    AND date = p_date
    AND time_slot = p_time;
  
  IF FOUND THEN
    -- Check if blocked
    IF v_slot.is_blocked THEN
      RETURN jsonb_build_object(
        'available', false,
        'reason', 'Time slot is blocked',
        'spots_remaining', 0
      );
    END IF;
    
    v_available_covers := v_slot.max_covers - v_slot.booked_covers;
    
    RETURN jsonb_build_object(
      'available', v_available_covers >= p_covers,
      'spots_remaining', v_available_covers,
      'max_covers', v_slot.max_covers
    );
  END IF;
  
  -- No specific slot, check general restaurant capacity from orders
  SELECT COALESCE(SUM((metadata->>'guests')::int), 0) INTO v_available_covers
  FROM orders
  WHERE order_type = 'food'
    AND metadata->>'restaurant_id' = p_restaurant_id::text
    AND DATE(start_at) = p_date
    AND start_at::time BETWEEN p_time - interval '1 hour' AND p_time + interval '1 hour'
    AND status NOT IN ('cancelled', 'refunded');
  
  -- Default max covers per slot is 30
  RETURN jsonb_build_object(
    'available', (30 - v_available_covers) >= p_covers,
    'spots_remaining', GREATEST(0, 30 - v_available_covers),
    'max_covers', 30
  );
END;
$$;

-- 4. Function to get order timeline for tracking
CREATE OR REPLACE FUNCTION get_order_timeline(p_order_id UUID)
RETURNS TABLE (
  status TEXT,
  actor_name TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    osh.to_status::text as status,
    COALESCE(pr.full_name, 'System') as actor_name,
    osh.reason,
    osh.created_at
  FROM order_status_history osh
  LEFT JOIN profiles pr ON osh.actor_user_id = pr.id
  WHERE osh.order_id = p_order_id
  ORDER BY osh.created_at ASC;
END;
$$;

-- 5. Function to verify if user purchased an item (for reviews)
CREATE OR REPLACE FUNCTION is_verified_purchase(
  p_user_id UUID,
  p_item_type TEXT,
  p_item_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_order BOOLEAN;
BEGIN
  -- Check in orders table
  SELECT EXISTS (
    SELECT 1 FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.customer_user_id = p_user_id
      AND o.status IN ('completed', 'confirmed')
      AND (
        oi.product_id = p_item_id 
        OR oi.resource_id = p_item_id
        OR o.metadata->>'entity_id' = p_item_id::text
      )
  ) INTO v_has_order;
  
  IF v_has_order THEN
    RETURN true;
  END IF;
  
  -- Check legacy bookings table
  SELECT EXISTS (
    SELECT 1 FROM bookings b
    JOIN booking_items bi ON b.id = bi.booking_id
    WHERE b.user_id = p_user_id
      AND b.status IN ('completed', 'confirmed')
      AND bi.item_id = p_item_id::text
  ) INTO v_has_order;
  
  RETURN v_has_order;
END;
$$;

-- 6. Trigger to auto-set is_verified_purchase on review insert
CREATE OR REPLACE FUNCTION set_review_verified_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.is_verified_purchase := is_verified_purchase(
    NEW.user_id,
    NEW.item_type,
    NEW.item_id::uuid
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_review_verified ON reviews;
CREATE TRIGGER trg_set_review_verified
  BEFORE INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION set_review_verified_status();

-- 7. Index for faster order timeline queries
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id 
  ON order_status_history(order_id, created_at);

-- 8. Index for restaurant availability lookups
CREATE INDEX IF NOT EXISTS idx_restaurant_availability_lookup 
  ON restaurant_availability(restaurant_id, date, time_slot);
