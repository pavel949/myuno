-- Fix: add stable search_path to clearview_grade_to_recommendation
-- This was the only project-owned function missing search_path (linter 0011)
ALTER FUNCTION public.clearview_grade_to_recommendation(text) SET search_path = public;