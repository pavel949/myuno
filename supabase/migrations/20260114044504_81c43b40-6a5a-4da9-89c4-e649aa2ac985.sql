-- =============================================
-- FIX REMAINING CRITICAL SECURITY ISSUES (Part 3b)
-- =============================================

-- BOOKING_PAYMENTS - System-only insert/update policies
DROP POLICY IF EXISTS "System can insert payments" ON public.booking_payments;
DROP POLICY IF EXISTS "System can update payments" ON public.booking_payments;

CREATE POLICY "Only service role can insert payments"
ON public.booking_payments FOR INSERT
WITH CHECK (false);

CREATE POLICY "Only service role can update payments"
ON public.booking_payments FOR UPDATE
USING (false);

-- FEATURED_LISTINGS - Require payment verification via trigger
CREATE OR REPLACE FUNCTION public.validate_featured_listing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stripe_payment_id IS NULL OR NEW.stripe_payment_id = '' THEN
    RAISE EXCEPTION 'Featured listing requires valid payment ID';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_featured_listing_trigger ON public.featured_listings;
CREATE TRIGGER validate_featured_listing_trigger
BEFORE INSERT ON public.featured_listings
FOR EACH ROW
EXECUTE FUNCTION public.validate_featured_listing();

-- VENDOR_PAYOUTS - Validate payout doesn't exceed balance
CREATE OR REPLACE FUNCTION public.validate_vendor_payout()
RETURNS TRIGGER AS $$
DECLARE
  available_balance NUMERIC;
BEGIN
  SELECT COALESCE(pending_payout, 0) INTO available_balance
  FROM public.providers
  WHERE id = NEW.provider_id;
  
  IF NEW.amount > available_balance THEN
    RAISE EXCEPTION 'Payout amount exceeds available balance';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_vendor_payout_trigger ON public.vendor_payouts;
CREATE TRIGGER validate_vendor_payout_trigger
BEFORE INSERT ON public.vendor_payouts
FOR EACH ROW
EXECUTE FUNCTION public.validate_vendor_payout();

-- WALLET_TRANSACTIONS - Restrict insert to system
DROP POLICY IF EXISTS "System can insert wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Only service role can insert transactions"
ON public.wallet_transactions FOR INSERT
WITH CHECK (false);

-- BOOKING_STATUS_HISTORY - Only booking participants can add history
DROP POLICY IF EXISTS "Booking participants can add status history" ON public.booking_status_history;
CREATE POLICY "Booking participants add status history"
ON public.booking_status_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_status_history.booking_id 
    AND (
      b.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.providers pr
        WHERE pr.id = b.provider_id AND pr.user_id = auth.uid()
      )
    )
  )
);

-- ADMIN_AUDIT_LOGS - Only service role can insert
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Only service role can create audit logs"
ON public.admin_audit_logs FOR INSERT
WITH CHECK (false);