-- Compatible application rollback: revert ManagementTermsForm/hooks first.
-- Retain the nullable column and saved configuration to avoid data loss.
-- Retain validation: older clients must not activate incomplete/invalid terms.
-- No data, permissions or financial operations require reversal.
DO $$ BEGIN RAISE NOTICE 'Revert configuration UI/hooks; retain accounting_policy and validation triggers. No data rollback is performed.'; END $$;

