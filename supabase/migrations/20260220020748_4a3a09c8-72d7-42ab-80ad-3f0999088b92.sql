
-- Fix 3 Security Definer Views by setting security_invoker=true
-- These are public catalog views that don't expose PII, but should still use invoker security

ALTER VIEW public.catalog_life_map_v2 SET (security_invoker = true);
ALTER VIEW public.lifeos_health_view SET (security_invoker = true);
ALTER VIEW public.vertical_task_coverage SET (security_invoker = true);

-- Fix function search_path mutable for set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
