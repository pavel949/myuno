
-- =====================================================
-- HOTFIX: Correct triggers & RLS that wrongly reference 
-- 'properties' instead of 'owner_properties'
-- =====================================================

-- 1. Add management_company_id to owner_properties for MC scoping
ALTER TABLE public.owner_properties
  ADD COLUMN IF NOT EXISTS management_company_id uuid REFERENCES management_companies(id);

-- Create index for MC lookup
CREATE INDEX IF NOT EXISTS idx_owner_properties_mc_id 
  ON owner_properties(management_company_id);

-- 2. Fix auto-expense trigger: reference owner_properties instead of properties
CREATE OR REPLACE FUNCTION public.fn_auto_expense_on_task_done()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_financial_id uuid;
BEGIN
  -- Only fire when status changes TO 'done' and there's a cost
  IF NEW.status = 'done'
     AND (OLD.status IS DISTINCT FROM 'done')
     AND COALESCE(NEW.actual_cost, 0) > 0
     AND NEW.expense_created IS NOT TRUE
  THEN
    -- Get owner_id from owner_properties (correct FK target)
    SELECT owner_id INTO v_owner_id
    FROM owner_properties
    WHERE id = NEW.property_id;

    IF v_owner_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Insert into property_financials
    INSERT INTO property_financials (
      property_id, owner_id, transaction_type, category,
      amount, currency, description, reference_type, reference_id,
      transaction_date, status, cost_source
    ) VALUES (
      NEW.property_id,
      v_owner_id,
      'expense',
      CASE NEW.task_type
        WHEN 'maintenance' THEN 'maintenance'
        WHEN 'cleaning' THEN 'cleaning'
        ELSE 'operations'
      END,
      NEW.actual_cost,
      COALESCE(NEW.cost_currency, 'THB'),
      COALESCE(NEW.title, 'Operational task expense'),
      'operational_task',
      NEW.id,
      COALESCE(NEW.completed_at::date, CURRENT_DATE),
      'recorded',
      'auto_task'
    )
    RETURNING id INTO v_financial_id;

    -- Mark as created to prevent duplicates
    NEW.expense_created := true;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Fix RLS policy on operational_tasks: use owner_properties instead of properties
DROP POLICY IF EXISTS owners_and_mc_manage_operational_tasks ON property_operational_tasks;
CREATE POLICY owners_and_mc_manage_operational_tasks ON property_operational_tasks
  FOR ALL TO authenticated
  USING (
    -- Owner access via owner_properties
    property_id IN (SELECT id FROM owner_properties WHERE owner_id = auth.uid())
    OR
    -- MC member access via owner_properties.management_company_id
    property_id IN (
      SELECT op.id FROM owner_properties op
      JOIN management_company_members mcm ON mcm.company_id = op.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
    OR
    -- Assigned staff
    assigned_to = auth.uid()
  )
  WITH CHECK (
    property_id IN (SELECT id FROM owner_properties WHERE owner_id = auth.uid())
    OR
    property_id IN (
      SELECT op.id FROM owner_properties op
      JOIN management_company_members mcm ON mcm.company_id = op.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
    OR
    assigned_to = auth.uid()
  );

-- 4. Fix financial reconciliation trigger: handle both tables
CREATE OR REPLACE FUNCTION public.fn_sync_financial_to_ledger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mc_id uuid;
  v_expense_account_id uuid;
  v_owner_account_id uuid;
BEGIN
  -- Skip if already synced
  IF NEW.reference_type = 'ledger_synced' THEN
    RETURN NEW;
  END IF;

  -- Try owner_properties first (PMS context), then properties (marketplace)
  SELECT management_company_id INTO v_mc_id
  FROM owner_properties WHERE id = NEW.property_id;

  IF v_mc_id IS NULL THEN
    SELECT management_company_id INTO v_mc_id
    FROM properties WHERE id = NEW.property_id;
  END IF;

  -- Create ledger entries only if MC is found
  IF v_mc_id IS NOT NULL THEN
    -- Find or create expense account for this MC
    SELECT id INTO v_expense_account_id
    FROM ledger_accounts
    WHERE management_company_id = v_mc_id
      AND account_type = 'expense'
      AND is_active = true
    LIMIT 1;

    IF v_expense_account_id IS NULL THEN
      INSERT INTO ledger_accounts (account_type, management_company_id, currency)
      VALUES ('expense', v_mc_id, COALESCE(NEW.currency, 'THB'))
      RETURNING id INTO v_expense_account_id;
    END IF;

    -- Find or create owner payout account
    SELECT id INTO v_owner_account_id
    FROM ledger_accounts
    WHERE owner_user_id = NEW.owner_id
      AND account_type = 'owner_payout'
      AND is_active = true
    LIMIT 1;

    IF v_owner_account_id IS NULL THEN
      INSERT INTO ledger_accounts (account_type, owner_user_id, currency)
      VALUES ('owner_payout', NEW.owner_id, COALESCE(NEW.currency, 'THB'))
      RETURNING id INTO v_owner_account_id;
    END IF;

    -- Create double-entry ledger record
    IF NEW.transaction_type = 'expense' THEN
      INSERT INTO ledger_entries (
        debit_account_id, credit_account_id, amount, currency,
        entry_type, description
      ) VALUES (
        v_expense_account_id, v_owner_account_id,
        NEW.amount, COALESCE(NEW.currency, 'THB'),
        'property_expense',
        COALESCE(NEW.description, 'Auto-synced from property financials')
      );
    ELSIF NEW.transaction_type = 'income' THEN
      INSERT INTO ledger_entries (
        debit_account_id, credit_account_id, amount, currency,
        entry_type, description
      ) VALUES (
        v_owner_account_id, v_expense_account_id,
        NEW.amount, COALESCE(NEW.currency, 'THB'),
        'property_income',
        COALESCE(NEW.description, 'Auto-synced from property financials')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Sync management_company_id from properties to owner_properties where IDs match
UPDATE owner_properties op
SET management_company_id = p.management_company_id
FROM properties p
WHERE op.id = p.id
  AND p.management_company_id IS NOT NULL
  AND op.management_company_id IS NULL;
