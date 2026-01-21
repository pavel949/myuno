
-- Fix search_path: add pg_temp to remaining functions
-- Note: generate_order_number, update_updated_at_column, handle_new_user were already fixed

-- 1. verify_user_pin - keep exact parameter name p_pin
CREATE OR REPLACE FUNCTION public.verify_user_pin(p_user_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT pin_hash INTO stored_hash
  FROM public.user_pins
  WHERE user_id = p_user_id;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN stored_hash = extensions.crypt(p_pin, stored_hash);
END;
$function$;

-- 2. set_user_pin - keep exact parameter names
CREATE OR REPLACE FUNCTION public.set_user_pin(p_user_id uuid, p_pin text, p_device_id text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  hashed_pin TEXT;
BEGIN
  IF p_pin !~ '^\d{6}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 6 digits';
  END IF;
  
  hashed_pin := extensions.crypt(p_pin, extensions.gen_salt('bf'));
  
  INSERT INTO public.user_pins (user_id, pin_hash, device_id)
  VALUES (p_user_id, hashed_pin, p_device_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET pin_hash = hashed_pin, device_id = p_device_id, updated_at = now();
  
  RETURN TRUE;
END;
$function$;

-- 3. Add ical_token_expires_at for token rotation security
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS ical_token_expires_at timestamptz DEFAULT (now() + interval '1 year'),
ADD COLUMN IF NOT EXISTS ical_token_refreshed_at timestamptz DEFAULT now();

-- 4. Create function to rotate iCal token for security
CREATE OR REPLACE FUNCTION public.rotate_ical_token(p_property_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_token text;
BEGIN
  v_new_token := encode(gen_random_bytes(32), 'hex');
  
  UPDATE owner_properties
  SET 
    ical_token = v_new_token,
    ical_token_expires_at = now() + interval '1 year',
    ical_token_refreshed_at = now()
  WHERE id = p_property_id;
  
  RETURN v_new_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rotate_ical_token(uuid) TO authenticated;
