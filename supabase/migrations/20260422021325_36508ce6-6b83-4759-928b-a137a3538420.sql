-- Make handle_new_user idempotent so duplicate auth.users INSERTs (rare) don't break signup.
-- Adds partial unique index on profiles.phone to enforce 1 phone = 1 UUID, supporting phone-OTP identity linking.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile (idempotent)
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.phone, '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Assign default 'user' role (idempotent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Partial unique index: one phone => one UUID (allows multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx
  ON public.profiles (phone)
  WHERE phone IS NOT NULL AND phone <> '';

-- Seed phone OTP feature flag (off by default until SMS provider is wired)
INSERT INTO public.system_settings (key, value)
VALUES ('feature_flag:auth_phone', '{"enabled": false, "rolloutPct": 100}'::jsonb)
ON CONFLICT (key) DO NOTHING;
