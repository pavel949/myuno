-- Fix search_path for all functions
ALTER FUNCTION public.get_or_create_loyalty_status(UUID) SET search_path = public;
ALTER FUNCTION public.recalculate_user_tier(UUID) SET search_path = public;
ALTER FUNCTION public.award_achievement(UUID, TEXT) SET search_path = public;