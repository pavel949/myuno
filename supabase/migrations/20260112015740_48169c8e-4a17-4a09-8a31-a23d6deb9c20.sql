-- Fix search_path security warnings for all functions
ALTER FUNCTION public.calculate_distance_km(double precision, double precision, double precision, double precision) SET search_path = public;
ALTER FUNCTION public.find_nearby_salons(double precision, double precision, double precision) SET search_path = public;
ALTER FUNCTION public.find_nearby_restaurants(double precision, double precision, double precision) SET search_path = public;
ALTER FUNCTION public.find_nearby_clinics(double precision, double precision, double precision) SET search_path = public;
ALTER FUNCTION public.find_nearby_gyms(double precision, double precision, double precision) SET search_path = public;
ALTER FUNCTION public.find_nearby_flower_shops(double precision, double precision, double precision) SET search_path = public;