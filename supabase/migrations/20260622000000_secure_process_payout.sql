-- Security fix: process_payout was granted to `authenticated` with no in-function
-- authorization check, so any logged-in user could mark any vendor payout as
-- `completed` and decrement a provider's pending balance (fraudulent settlement).
--
-- Add an authorization guard inside the SECURITY DEFINER function: only admin/finance
-- staff (or service-role / backend callers, where auth.uid() is NULL) may execute it.
-- The function signature and behaviour are otherwise unchanged.

CREATE OR REPLACE FUNCTION public.process_payout(
  p_payout_id UUID,
  p_new_status TEXT,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout RECORD;
  v_provider RECORD;
  v_new_pending NUMERIC;
  v_uid UUID := auth.uid();
BEGIN
  -- Authorization: block authenticated non-staff users. Backend/service-role
  -- callers have a NULL auth.uid() and remain permitted.
  IF v_uid IS NOT NULL
     AND NOT public.has_role(v_uid, 'admin')
     AND NOT public.has_role(v_uid, 'finance') THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized to process payouts');
  END IF;

  -- Get payout details with lock
  SELECT * INTO v_payout
  FROM vendor_payouts
  WHERE id = p_payout_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Payout not found');
  END IF;

  -- Validate status transition
  IF v_payout.status NOT IN ('pending', 'processing') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid payout status for processing');
  END IF;

  IF p_new_status NOT IN ('completed', 'failed') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid target status');
  END IF;

  -- Update payout status
  UPDATE vendor_payouts
  SET
    status = p_new_status,
    processed_at = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE processed_at END,
    payment_reference = COALESCE(p_payment_reference, payment_reference)
  WHERE id = p_payout_id;

  -- If completed, atomically update provider balance
  IF p_new_status = 'completed' THEN
    SELECT * INTO v_provider
    FROM providers
    WHERE id = v_payout.provider_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Provider not found');
    END IF;

    v_new_pending := GREATEST(0, COALESCE(v_provider.pending_payout, 0) - v_payout.amount);

    UPDATE providers
    SET
      pending_payout = v_new_pending,
      updated_at = NOW()
    WHERE id = v_payout.provider_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'payout_id', p_payout_id,
    'new_status', p_new_status
  );
END;
$$;
