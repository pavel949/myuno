-- =====================================================
-- PRE-FIX 0: add 'expired' to order_status enum
-- =====================================================
DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'expired';
EXCEPTION WHEN others THEN NULL;
END $$;

-- =====================================================
-- PRE-FIX 1: Extend ledger constraints
-- =====================================================
ALTER TABLE public.ledger_accounts DROP CONSTRAINT IF EXISTS ledger_accounts_account_type_check;
ALTER TABLE public.ledger_accounts ADD CONSTRAINT ledger_accounts_account_type_check
  CHECK (account_type = ANY (ARRAY[
    'user_wallet','vendor_balance','platform_revenue','escrow','refund_reserve',
    'customer','platform_cashback','mc_balance','expense','owner_payout','income'
  ]));

ALTER TABLE public.ledger_accounts DROP CONSTRAINT IF EXISTS owner_check;
ALTER TABLE public.ledger_accounts ADD CONSTRAINT owner_check CHECK (
  ((owner_user_id IS NOT NULL) AND (owner_org_id IS NULL) AND (management_company_id IS NULL))
  OR ((owner_user_id IS NULL) AND (owner_org_id IS NOT NULL) AND (management_company_id IS NULL))
  OR ((owner_user_id IS NULL) AND (owner_org_id IS NULL) AND (management_company_id IS NOT NULL))
  OR ((owner_user_id IS NULL) AND (owner_org_id IS NULL) AND (management_company_id IS NULL)
      AND (account_type = ANY (ARRAY['platform_revenue','escrow','refund_reserve','platform_cashback','income'])))
);

ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_entry_type_check;
ALTER TABLE public.ledger_entries ADD CONSTRAINT ledger_entries_entry_type_check
  CHECK (entry_type = ANY (ARRAY[
    'payment','refund','payout','fee','adjustment','topup',
    'platform_fee','vendor_payment','mc_commission','cashback',
    'property_income','property_expense','income','expense'
  ]));