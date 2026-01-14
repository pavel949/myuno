-- Create table for storing user PINs (hashed)
CREATE TABLE public.user_pins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_pins ENABLE ROW LEVEL SECURITY;

-- Users can only view and manage their own PIN
CREATE POLICY "Users can view their own PIN" 
ON public.user_pins 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PIN" 
ON public.user_pins 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PIN" 
ON public.user_pins 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PIN" 
ON public.user_pins 
FOR DELETE 
USING (auth.uid() = user_id);

-- Function to update timestamp
CREATE TRIGGER update_user_pins_updated_at
BEFORE UPDATE ON public.user_pins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to hash PIN and verify (using pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to verify PIN by device
CREATE OR REPLACE FUNCTION public.verify_user_pin(p_user_id UUID, p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT pin_hash INTO stored_hash
  FROM public.user_pins
  WHERE user_id = p_user_id;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN stored_hash = crypt(p_pin, stored_hash);
END;
$$;

-- Function to set PIN
CREATE OR REPLACE FUNCTION public.set_user_pin(p_user_id UUID, p_pin TEXT, p_device_id TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hashed_pin TEXT;
BEGIN
  -- Validate PIN is 6 digits
  IF p_pin !~ '^\d{6}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 6 digits';
  END IF;
  
  -- Hash the PIN
  hashed_pin := crypt(p_pin, gen_salt('bf'));
  
  -- Upsert the PIN
  INSERT INTO public.user_pins (user_id, pin_hash, device_id)
  VALUES (p_user_id, hashed_pin, p_device_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET pin_hash = hashed_pin, device_id = p_device_id, updated_at = now();
  
  RETURN TRUE;
END;
$$;