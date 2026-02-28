
-- Fix security definer views: set security_invoker = true
ALTER VIEW public.restaurants SET (security_invoker = true);
ALTER VIEW public.yachts SET (security_invoker = true);
ALTER VIEW public.vehicles SET (security_invoker = true);
ALTER VIEW public.experiences SET (security_invoker = true);
ALTER VIEW public.clinics SET (security_invoker = true);
ALTER VIEW public.education_centers SET (security_invoker = true);
ALTER VIEW public.babysitters SET (security_invoker = true);
ALTER VIEW public.cleaning_providers SET (security_invoker = true);
ALTER VIEW public.pet_services SET (security_invoker = true);
ALTER VIEW public.banks SET (security_invoker = true);
ALTER VIEW public.tours SET (security_invoker = true);
