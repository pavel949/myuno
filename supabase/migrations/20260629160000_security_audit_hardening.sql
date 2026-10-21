-- Security audit hardening pass (2026-06-29)
--
-- Closes privilege-escalation and write-validation gaps surfaced by the
-- codebase security audit. Every statement is idempotent so the migration is
-- safe to re-run. Authorization helpers used here (public.is_admin_or_uno_team,
-- public.has_role) read from public.user_roles and are SECURITY DEFINER with a
-- pinned search_path, so they are not affected by the profiles.user_type issue
-- fixed below.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CRITICAL — privilege escalation via profiles.user_type self-update
--
-- The effective `profiles` UPDATE policy is `USING (id = auth.uid()) WITH CHECK
-- (id = auth.uid())`, which lets any authenticated user set ANY column on their
-- own row — including `user_type`. The user_type enum includes 'admin' and
-- 'uno_team' (added in 20260121141848), and ~7 migrations' RLS policies plus
-- the soft_delete_order / rotate_ical_token SECURITY DEFINER functions treat
-- `profiles.user_type IN ('admin','uno_team')` as an admin gate. So a regular
-- user could run `UPDATE profiles SET user_type='admin'` and self-elevate.
--
-- Fix: a BEFORE UPDATE trigger that silently reverts any change to user_type
-- unless the caller is a platform admin (via user_roles) or a server-side
-- service-role context (auth.uid() IS NULL). Normal profile edits never change
-- user_type, so legitimate flows are unaffected. This neutralizes the entire
-- escalation chain without touching the legacy user_type-based policies.
CREATE OR REPLACE FUNCTION public.prevent_user_type_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.user_type IS DISTINCT FROM OLD.user_type
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin_or_uno_team() THEN
    -- Authenticated, non-admin caller attempting to change user_type — keep the
    -- existing value instead of allowing the change.
    NEW.user_type := OLD.user_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_user_type_self_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_user_type_self_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_user_type_self_escalation();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CRITICAL — orders self-update has no WITH CHECK (status/amount tampering)
--
-- The `orders_update_own` policy (`FOR UPDATE USING (customer_user_id =
-- auth.uid() AND deleted_at IS NULL)`) has no WITH CHECK, so a customer can
-- UPDATE their own order's `status` to 'paid'/'completed' or zero out
-- `total_amount` / fee columns, bypassing the payment flow.
--
-- Fix: a BEFORE UPDATE trigger that blocks changes to protected financial /
-- status columns ONLY when the caller is the order's own customer and is not a
-- platform admin. Operators, MC owners, admins and server-side (service-role,
-- auth.uid() IS NULL) order mutations are governed by their own RLS policies
-- and are unaffected — they never match `auth.uid() = OLD.customer_user_id`
-- (operators/owners) or are explicitly allowed (admins / service role).
CREATE OR REPLACE FUNCTION public.guard_orders_protected_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND auth.uid() = OLD.customer_user_id
     AND NOT public.is_admin_or_uno_team() THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
       OR NEW.platform_fee_amount IS DISTINCT FROM OLD.platform_fee_amount
       OR NEW.vendor_payout_amount IS DISTINCT FROM OLD.vendor_payout_amount THEN
      RAISE EXCEPTION 'Not authorized to modify order status or financial fields';
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

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. HIGH — user_roles admin-manage policy missing WITH CHECK
--
-- `"Admins can manage all roles"` is FOR ALL with only a USING clause, so the
-- new row written on INSERT/UPDATE is unvalidated. Mirror the USING predicate
-- into WITH CHECK so role grants are constrained to admins on both sides.
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. HIGH — thai_bookings_update missing WITH CHECK
--
-- The 20260629142449 migration recreated thai_bookings_update with only a
-- USING clause, reverting the WITH CHECK added by the 2026-06-24 hardening
-- migration. Without WITH CHECK a customer can reassign customer_id / business_id
-- on their own booking. Re-add the matching WITH CHECK.
DROP POLICY IF EXISTS thai_bookings_update ON public.thai_bookings;
CREATE POLICY thai_bookings_update ON public.thai_bookings
  FOR UPDATE
  USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.thai_businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
    OR public.is_admin_or_uno_team()
  )
  WITH CHECK (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.thai_businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
    OR public.is_admin_or_uno_team()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. MEDIUM — ensure_multi_role_qa_bundle executable by anon
--
-- A QA helper function should never be callable by unauthenticated clients.
-- Revoke the anon grant (the function is currently a stub, so this is purely
-- preventative). Wrapped so the migration does not fail if the function name
-- ever changes.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'ensure_multi_role_qa_bundle'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.ensure_multi_role_qa_bundle() FROM anon;
  END IF;
END $$;
