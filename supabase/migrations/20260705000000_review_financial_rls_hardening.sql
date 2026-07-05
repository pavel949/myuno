-- ─────────────────────────────────────────────────────────────────────────────
-- Financial-integrity RLS hardening (production code review, 2026-07-05)
--
-- The 2026-06-29 hardening pass added column guards that only fire on the
-- *customer* write path (auth.uid() = customer_user_id). The same money tables
-- are writable through vendor / operator / owner RLS policies that those guards
-- never evaluate. This migration closes those non-customer write paths.
--
-- Idempotent / safe to re-run. Uses existing helpers public.is_admin_or_uno_team.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── C-1: orders — guard financial columns for EVERY non-admin caller ──────────
-- Previously the guard only fired when auth.uid() = OLD.customer_user_id, so a
-- vendor org-member (via "Vendors can update own org orders") could inflate
-- total_amount / platform_fee_amount / vendor_payout_amount or move status.
-- Legitimate vendor/operator flows only ever change `status` (verified in
-- OperatorTransfers.tsx / MCBookingsPage.tsx), never the financial columns —
-- so we block the three financial columns for all non-admins, and keep the
-- `status` restriction scoped to the customer path (unchanged behaviour for
-- vendors). record_ledger_entries / process_payout derive money from these
-- columns, so locking them here is the authoritative fix.
CREATE OR REPLACE FUNCTION public.guard_orders_protected_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin_or_uno_team() THEN
    -- Financial columns: never client-writable by any non-admin (customer OR vendor).
    IF NEW.total_amount        IS DISTINCT FROM OLD.total_amount
       OR NEW.platform_fee_amount  IS DISTINCT FROM OLD.platform_fee_amount
       OR NEW.vendor_payout_amount IS DISTINCT FROM OLD.vendor_payout_amount THEN
      RAISE EXCEPTION 'Not authorized to modify order financial fields';
    END IF;
    -- Status: customers still may not change it (payment flow owns that);
    -- vendors/operators retain their legitimate status transitions.
    IF auth.uid() = OLD.customer_user_id
       AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Not authorized to modify order status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_orders_protected_columns ON public.orders;
CREATE TRIGGER trg_guard_orders_protected_columns
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_orders_protected_columns();

-- ── C-2: providers — block self-write of payout/earning/approval columns ──────
-- "Owners can manage their own provider" is FOR ALL with no column restriction,
-- letting a vendor set pending_payout / total_earnings / approval_status
-- directly and bypass the (correctly admin-gated) process_payout RPC.
CREATE OR REPLACE FUNCTION public.guard_providers_protected_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin_or_uno_team() THEN
    IF NEW.pending_payout  IS DISTINCT FROM OLD.pending_payout
       OR NEW.total_earnings   IS DISTINCT FROM OLD.total_earnings
       OR NEW.approval_status  IS DISTINCT FROM OLD.approval_status THEN
      RAISE EXCEPTION 'Not authorized to modify provider financial or approval fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_providers_protected_columns ON public.providers;
CREATE TRIGGER trg_guard_providers_protected_columns
  BEFORE UPDATE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_providers_protected_columns();

-- ── C-3: order_payment_stages — customers may not self-transition stages ──────
-- The UPDATE policy had no WITH CHECK, so a customer could set their own
-- deposit/balance stage to 'paid'/'refunded' with arbitrary amounts. No client
-- code updates this table (transitions are server-side), so restricting writes
-- to admins/service-role is non-breaking.
DROP POLICY IF EXISTS "Users can update own payment stages" ON public.order_payment_stages;
CREATE POLICY "Users can update own payment stages"
ON public.order_payment_stages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND o.customer_user_id = auth.uid()
  )
  OR public.is_admin_or_uno_team()
)
WITH CHECK (public.is_admin_or_uno_team());

-- ── H-2: payment_intents — client INSERTs restricted to pending, bounded ──────
-- No client code inserts payment_intents (the service-role checkout handler
-- does), so a client-inserted row could only be a forged 'succeeded' record
-- used to deceive the staff order dashboard. Constrain to status='pending' and
-- amount <= the order's total.
DROP POLICY IF EXISTS "Create payment intents" ON public.payment_intents;
CREATE POLICY "Create payment intents" ON public.payment_intents
FOR INSERT
WITH CHECK (
  status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payment_intents.order_id
      AND o.customer_user_id = auth.uid()
      AND payment_intents.amount <= o.total_amount
  )
);

-- ── H-3: vendor_payouts — requested amount must not exceed earned balance ─────
DROP POLICY IF EXISTS "Providers can request payouts" ON public.vendor_payouts;
CREATE POLICY "Providers can request payouts" ON public.vendor_payouts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.id = vendor_payouts.provider_id
      AND p.user_id = auth.uid()
      AND vendor_payouts.amount <= p.pending_payout
  )
);

-- ── M-1: thai_businesses — owner may not self-approve or fake ratings ─────────
-- is_active is an admin moderation gate; rating_avg/rating_count are derived.
-- Owner edits never change is_active (only the new-business INSERT sets it
-- false), and the admin toggle bypasses this guard, so blocking a non-admin
-- from setting is_active=true and from editing ratings is non-breaking.
CREATE OR REPLACE FUNCTION public.guard_thai_businesses_protected_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin_or_uno_team() THEN
    IF NEW.is_active = true AND OLD.is_active IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Not authorized to activate business (admin moderation required)';
    END IF;
    IF NEW.rating_avg   IS DISTINCT FROM OLD.rating_avg
       OR NEW.rating_count IS DISTINCT FROM OLD.rating_count THEN
      RAISE EXCEPTION 'Not authorized to modify business rating fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_thai_businesses_protected_columns ON public.thai_businesses;
CREATE TRIGGER trg_guard_thai_businesses_protected_columns
  BEFORE UPDATE ON public.thai_businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_thai_businesses_protected_columns();

-- ── M-3: profiles — anti-escalation trigger must also cover INSERT ────────────
-- handle_new_user() creates the profile inside the auth.users transaction and
-- swallows all exceptions; if that insert ever fails, a client INSERT with
-- user_type='admin' could win the race. Extend the guard to INSERT.
CREATE OR REPLACE FUNCTION public.prevent_user_type_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Non-admin, authenticated client INSERT may not self-assign a privileged
    -- user_type. Server-side/service-role (auth.uid() IS NULL) is unaffected.
    IF NEW.user_type IS NOT NULL
       AND auth.uid() IS NOT NULL
       AND NOT public.is_admin_or_uno_team()
       AND NEW.user_type IN ('admin', 'uno_team') THEN
      NEW.user_type := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE path (unchanged behaviour)
  IF NEW.user_type IS DISTINCT FROM OLD.user_type
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin_or_uno_team() THEN
    NEW.user_type := OLD.user_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_user_type_self_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_user_type_self_escalation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_user_type_self_escalation();
