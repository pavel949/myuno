-- Rollback for drizzle migrations 0013-0015 (date prices RPC, public read of active rate seasons).
DROP POLICY IF EXISTS "Public read active rate seasons of active properties" ON public.property_rate_seasons;
REVOKE SELECT ON public.property_rate_seasons FROM anon;
DROP FUNCTION IF EXISTS public.is_property_bookable_active(uuid);
DROP FUNCTION IF EXISTS public.get_property_date_prices(uuid, date, date);
-- Code: revert dateOverrides in src/lib/pricingEngine.ts, PropertyInquiry.tsx,
-- supabase/functions/_shared/property-quote.ts and create-property-deposit-checkout.
