-- Add preferred_theme to profiles so the user's theme follows them across devices.
-- Values: 'light' | 'dark' | 'system'. Validated by trigger (CHECK is not used per guidance).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_theme text;

CREATE OR REPLACE FUNCTION public.validate_preferred_theme()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.preferred_theme IS NOT NULL
     AND NEW.preferred_theme NOT IN ('light', 'dark', 'system') THEN
    RAISE EXCEPTION 'preferred_theme must be one of light, dark, system (got %)', NEW.preferred_theme;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_preferred_theme_trigger ON public.profiles;
CREATE TRIGGER validate_preferred_theme_trigger
  BEFORE INSERT OR UPDATE OF preferred_theme ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_preferred_theme();