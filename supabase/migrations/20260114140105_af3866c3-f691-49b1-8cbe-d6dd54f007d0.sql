-- Fix set_user_pin function to use extensions schema for pgcrypto functions
CREATE OR REPLACE FUNCTION public.set_user_pin(p_user_id uuid, p_pin text, p_device_id text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  hashed_pin TEXT;
BEGIN
  -- Validate PIN is 6 digits
  IF p_pin !~ '^\d{6}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 6 digits';
  END IF;
  
  -- Hash the PIN using extensions.crypt and extensions.gen_salt
  hashed_pin := extensions.crypt(p_pin, extensions.gen_salt('bf'));
  
  -- Upsert the PIN
  INSERT INTO public.user_pins (user_id, pin_hash, device_id)
  VALUES (p_user_id, hashed_pin, p_device_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET pin_hash = hashed_pin, device_id = p_device_id, updated_at = now();
  
  RETURN TRUE;
END;
$function$;

-- Also fix verify_user_pin function
CREATE OR REPLACE FUNCTION public.verify_user_pin(p_user_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  stored_hash TEXT;
BEGIN
  -- Get the stored PIN hash
  SELECT pin_hash INTO stored_hash
  FROM public.user_pins
  WHERE user_id = p_user_id;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verify the PIN using extensions.crypt
  RETURN stored_hash = extensions.crypt(p_pin, stored_hash);
END;
$function$;