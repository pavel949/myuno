-- Fix vendor_payouts - use provider_id instead of vendor_id
DROP POLICY IF EXISTS "Vendors can view own payouts" ON public.vendor_payouts;
DROP POLICY IF EXISTS "Vendor payout owner only" ON public.vendor_payouts;
CREATE POLICY "Vendor payout owner access" 
ON public.vendor_payouts 
FOR SELECT 
USING (auth.uid() = provider_id);