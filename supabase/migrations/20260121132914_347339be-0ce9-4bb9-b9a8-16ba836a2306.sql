-- =====================================================
-- PRODUCTION SECURITY HARDENING MIGRATION v5
-- Fixed: ledger_accounts.owner_user_id
-- =====================================================

-- 7. ORDER_PARTICIPANTS - Already created successfully

-- 11. PAYMENT_INTENTS - Already created successfully

-- 12. LEDGER_ENTRIES - Use owner_user_id
DROP POLICY IF EXISTS "Users can view own ledger" ON public.ledger_entries;
DROP POLICY IF EXISTS "Account owners view ledger entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Account owners view own ledger entries" ON public.ledger_entries;

CREATE POLICY "Account owners view own ledger entries"
ON public.ledger_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ledger_accounts la
    WHERE (la.id = ledger_entries.debit_account_id OR la.id = ledger_entries.credit_account_id)
    AND la.owner_user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'uno_team'))
);

-- 13. OWNER_PROPERTIES - Already created successfully

-- 14. PROPERTY_DOCUMENTS - Already created successfully

-- 15. PROPERTY_GUIDEBOOK - Already created successfully

-- =====================================================
-- ADD NEW ROLES TO app_role ENUM
-- =====================================================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales';