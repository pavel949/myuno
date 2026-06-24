-- ECC audit — critical security & financial-integrity hardening
-- Derived from the repo-wide ECC agent analysis (2026-06-24).
--
-- Every risky statement is wrapped in an exception-guarded DO block so that a
-- name/column mismatch or pre-existing duplicate data can NEVER fail the
-- migration and block a deploy — the guard is skipped and a NOTICE is raised.
--
-- Scope (intentionally conservative — see PR notes for deferred items):
--   1. process_payout: add admin/finance authorization guard (was callable by
--      ANY authenticated user → could mutate any payout + provider balance).
--   2. record_ledger_entries: revoke from PUBLIC/anon/authenticated (service-role
--      callers only).
--   3. reconciliation_alerts: drop the over-permissive USING(true) policies.
--   4. thai_bookings: add WITH CHECK to the UPDATE policy (prevent row-ownership
--      reassignment via UPDATE).
--   5. Financial integrity: CHECK(amount > 0) + idempotency unique indexes.
--
-- DEFERRED (need code/feature-owner changes first, tracked separately):
--   - ledger_entries CHECK(debit_account_id <> credit_account_id): the
--     deposit-deduction RPC currently writes self-referential entries; adding
--     this constraint before that bug is fixed would hard-fail the deposit path.
--   - thai_bookings status-transition rules (customer must not self-confirm):
--     needs the booking state-machine spec; the WITH CHECK below only closes
--     ownership reassignment.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. process_payout — authorization guard (keeps EXECUTE for authenticated
--    admins who call it from the admin UI, but rejects everyone else).
--    Body reproduced verbatim from 20260121032053 + the guard after BEGIN.
-- ─────────────────────────────────────────────────────────────────────────────
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
BEGIN
  -- AUTHORIZATION GUARD (added by ECC audit hardening): only platform
  -- admins / uno_team / finance may move money. auth.uid() reflects the
  -- calling user even under SECURITY DEFINER.
  IF NOT (
    public.is_admin_or_uno_team()
    OR public.has_role(auth.uid(), 'finance'::public.app_role)
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Forbidden: admin or finance role required');
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
    -- Get provider with lock
    SELECT * INTO v_provider
    FROM providers
    WHERE id = v_payout.provider_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Provider not found');
    END IF;

    -- Calculate new pending amount (never go negative)
    v_new_pending := GREATEST(0, COALESCE(v_provider.pending_payout, 0) - v_payout.amount);

    -- Update provider balance
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

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. record_ledger_entries — restrict EXECUTE to service_role. Only edge
--    functions (service-role client) call it; PUBLIC/anon/authenticated must not.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  REVOKE EXECUTE ON FUNCTION public.record_ledger_entries(UUID) FROM PUBLIC, anon, authenticated;
  GRANT EXECUTE ON FUNCTION public.record_ledger_entries(UUID) TO service_role;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'skip record_ledger_entries grant change: %', SQLERRM;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. reconciliation_alerts — drop the open USING(true) policies. The admin-only
--    policy created in 20260418170124 remains the effective access control.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can view reconciliation alerts" ON public.reconciliation_alerts;
  DROP POLICY IF EXISTS "Authenticated users can update reconciliation alerts" ON public.reconciliation_alerts;
  DROP POLICY IF EXISTS "Allow insert reconciliation alerts" ON public.reconciliation_alerts;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'skip reconciliation_alerts policy drop: %', SQLERRM;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. thai_bookings — add WITH CHECK to the UPDATE policy so a customer/owner
--    cannot reassign the booking to another customer_id/business_id.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  DROP POLICY IF EXISTS thai_bookings_update ON public.thai_bookings;
  CREATE POLICY thai_bookings_update ON public.thai_bookings
    FOR UPDATE USING (
      customer_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.thai_businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
      OR public.is_admin_or_uno_team()
    )
    WITH CHECK (
      customer_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.thai_businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
      OR public.is_admin_or_uno_team()
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'skip thai_bookings_update policy update: %', SQLERRM;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Financial integrity — positive-amount checks (NOT VALID: enforced for new
--    rows, existing rows untouched) + idempotency unique indexes.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  ALTER TABLE public.ledger_entries
    ADD CONSTRAINT ledger_entries_amount_positive CHECK (amount > 0) NOT VALID;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'skip ledger_entries_amount_positive: %', SQLERRM;
END $$;

DO $$
BEGIN
  ALTER TABLE public.vendor_payouts
    ADD CONSTRAINT vendor_payouts_amount_positive CHECK (amount > 0) NOT VALID;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'skip vendor_payouts_amount_positive: %', SQLERRM;
END $$;

-- Idempotency: at most one ledger entry per (order, entry_type). Wrapped so a
-- pre-existing duplicate (the very bug this prevents) does not fail the deploy.
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_entries_order_entry_type
    ON public.ledger_entries(order_id, entry_type)
    WHERE order_id IS NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'skip uq_ledger_entries_order_entry_type (likely existing duplicates — clean up then re-create): %', SQLERRM;
END $$;

-- Idempotency: at most one payment_intents row per Stripe provider_ref.
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_intents_provider_ref
    ON public.payment_intents(provider_ref)
    WHERE provider_ref IS NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'skip uq_payment_intents_provider_ref (likely existing duplicates): %', SQLERRM;
END $$;

-- Helpful index for vendor payout lookups by provider.
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_vendor_payouts_provider ON public.vendor_payouts(provider_id);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'skip idx_vendor_payouts_provider: %', SQLERRM;
END $$;
