CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order_type TEXT,
  p_customer_user_id UUID,
  p_provider_org_id UUID DEFAULT NULL,
  p_start_at TIMESTAMPTZ DEFAULT NULL,
  p_end_at TIMESTAMPTZ DEFAULT NULL,
  p_total_amount NUMERIC DEFAULT 0,
  p_currency TEXT DEFAULT 'THB',
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_participants JSONB DEFAULT '[]'::jsonb,
  p_addresses JSONB DEFAULT '[]'::jsonb,
  p_payment_method TEXT DEFAULT NULL,
  p_payment_amount NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_participant JSONB;
  v_address JSONB;
BEGIN
  -- Create order
  INSERT INTO public.orders (
    order_type, customer_user_id, provider_org_id,
    status, start_at, end_at, total_amount, currency, notes, metadata
  ) VALUES (
    p_order_type, p_customer_user_id, p_provider_org_id,
    'pending', p_start_at, p_end_at, p_total_amount, p_currency, p_notes, p_metadata
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;
  
  -- Insert items
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO public.order_items (
        order_id, product_id, resource_id, provider_org_id,
        item_name, item_type, qty, unit_price, amount, 
        start_at, end_at, metadata
      ) VALUES (
        v_order_id,
        NULLIF(v_item->>'product_id', '')::uuid,
        NULLIF(v_item->>'resource_id', '')::uuid,
        COALESCE(NULLIF(v_item->>'provider_org_id', '')::uuid, p_provider_org_id),
        v_item->>'item_name',
        COALESCE(v_item->>'item_type', 'service'),
        COALESCE((v_item->>'qty')::int, 1),
        COALESCE((v_item->>'unit_price')::numeric, 0),
        COALESCE((v_item->>'amount')::numeric, 0),
        NULLIF(v_item->>'start_at', '')::timestamptz,
        NULLIF(v_item->>'end_at', '')::timestamptz,
        COALESCE(v_item->'metadata', '{}'::jsonb)
      );
    END LOOP;
  END IF;
  
  -- Insert participants
  IF p_participants IS NOT NULL AND jsonb_array_length(p_participants) > 0 THEN
    FOR v_participant IN SELECT * FROM jsonb_array_elements(p_participants)
    LOOP
      INSERT INTO public.order_participants (
        order_id, role, name, phone, email
      ) VALUES (
        v_order_id,
        COALESCE(v_participant->>'role', 'primary'),
        v_participant->>'name',
        v_participant->>'phone',
        v_participant->>'email'
      );
    END LOOP;
  END IF;
  
  -- Insert addresses
  IF p_addresses IS NOT NULL AND jsonb_array_length(p_addresses) > 0 THEN
    FOR v_address IN SELECT * FROM jsonb_array_elements(p_addresses)
    LOOP
      INSERT INTO public.order_addresses (
        order_id, address_type, address_text, lat, lng, notes
      ) VALUES (
        v_order_id,
        v_address->>'address_type',
        v_address->>'address_text',
        NULLIF(v_address->>'lat', '')::numeric,
        NULLIF(v_address->>'lng', '')::numeric,
        v_address->>'notes'
      );
    END LOOP;
  END IF;
  
  -- Create payment intent if provided (cast text to payment_method enum)
  IF p_payment_method IS NOT NULL AND p_payment_amount IS NOT NULL THEN
    INSERT INTO public.payment_intents (
      order_id, amount, currency, method, status
    ) VALUES (
      v_order_id, p_payment_amount, p_currency, p_payment_method::payment_method, 'pending'
    );
  END IF;
  
  -- Record initial status in history
  INSERT INTO public.order_status_history (
    order_id, from_status, to_status, actor_user_id, reason
  ) VALUES (
    v_order_id, NULL, 'pending', p_customer_user_id, 'Order created'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;