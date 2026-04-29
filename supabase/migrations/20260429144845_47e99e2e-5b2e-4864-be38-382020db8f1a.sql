-- Wave 5 batch 1 — drop 10 confirmed-orphan RPCs (audit: docs/audits/rpc-true-orphans-2026-04-29.txt)
DROP FUNCTION IF EXISTS public.find_nearby_clinics(double precision, double precision, double precision);
DROP FUNCTION IF EXISTS public.find_nearby_flower_shops(double precision, double precision, double precision);
DROP FUNCTION IF EXISTS public.find_nearby_gyms(double precision, double precision, double precision);
DROP FUNCTION IF EXISTS public.find_nearby_restaurants(double precision, double precision, double precision);
DROP FUNCTION IF EXISTS public.find_nearby_salons(double precision, double precision, double precision);
DROP FUNCTION IF EXISTS public.devmod_compute_fingerprint(text, text, text);
DROP FUNCTION IF EXISTS public.devmod_next_reservation_number();
DROP FUNCTION IF EXISTS public.devmod_next_rln_number();
DROP FUNCTION IF EXISTS public.devmod_update_foreign_quota(uuid);
DROP FUNCTION IF EXISTS public.cleanup_old_sync_logs();