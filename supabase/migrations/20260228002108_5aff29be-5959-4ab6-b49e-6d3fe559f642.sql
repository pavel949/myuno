
-- =====================================================
-- FIX 1: Auto-expense on maintenance task completion
-- =====================================================

-- 1a. Add cost columns to operational tasks
ALTER TABLE public.property_operational_tasks
  ADD COLUMN IF NOT EXISTS estimated_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_currency text DEFAULT 'THB',
  ADD COLUMN IF NOT EXISTS expense_created boolean DEFAULT false;

-- 1b. Trigger function: auto-create expense when task done with cost
CREATE OR REPLACE FUNCTION public.fn_auto_expense_on_task_done()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_financial_id uuid;
  v_expense_account_id uuid;
  v_revenue_account_id uuid;
BEGIN
  -- Only fire when status changes TO 'done' and there's a cost
  IF NEW.status = 'done'
     AND (OLD.status IS DISTINCT FROM 'done')
     AND COALESCE(NEW.actual_cost, 0) > 0
     AND NEW.expense_created IS NOT TRUE
  THEN
    -- Get owner_id from property
    SELECT owner_id INTO v_owner_id
    FROM properties
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

-- 1c. Attach trigger
DROP TRIGGER IF EXISTS trg_auto_expense_on_task_done ON property_operational_tasks;
CREATE TRIGGER trg_auto_expense_on_task_done
  BEFORE UPDATE ON property_operational_tasks
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_expense_on_task_done();


-- =====================================================
-- FIX 2: RLS hardening for MC isolation
-- =====================================================

-- 2a. Helper function: check if user is MC member for a property
CREATE OR REPLACE FUNCTION public.is_mc_member_for_property(p_user_id uuid, p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM properties p
    JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
    WHERE p.id = p_property_id
      AND mcm.user_id = p_user_id
      AND mcm.is_active = true
  );
$$;

-- 2b. Add MC-scoped SELECT policy on properties (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'properties' AND policyname = 'mc_member_select_company_properties'
  ) THEN
    CREATE POLICY mc_member_select_company_properties ON public.properties
      FOR SELECT TO authenticated
      USING (
        management_company_id IN (
          SELECT mcm.company_id
          FROM management_company_members mcm
          WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
        )
      );
  END IF;
END $$;

-- 2c. Add MC-scoped UPDATE policy on properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'properties' AND policyname = 'mc_member_update_company_properties'
  ) THEN
    CREATE POLICY mc_member_update_company_properties ON public.properties
      FOR UPDATE TO authenticated
      USING (
        management_company_id IN (
          SELECT mcm.company_id
          FROM management_company_members mcm
          WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
        )
      )
      WITH CHECK (
        management_company_id IN (
          SELECT mcm.company_id
          FROM management_company_members mcm
          WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
        )
      );
  END IF;
END $$;

-- 2d. Fix operational_tasks RLS: replace owner_properties reference with properties
DROP POLICY IF EXISTS owners_and_mc_manage_operational_tasks ON property_operational_tasks;
CREATE POLICY owners_and_mc_manage_operational_tasks ON property_operational_tasks
  FOR ALL TO authenticated
  USING (
    -- Owner access
    property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid())
    OR
    -- MC member access
    property_id IN (
      SELECT p.id FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
    OR
    -- Assigned staff
    assigned_to = auth.uid()
  )
  WITH CHECK (
    property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid())
    OR
    property_id IN (
      SELECT p.id FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
    OR
    assigned_to = auth.uid()
  );


-- =====================================================
-- FIX 3: Financial reconciliation trigger
-- property_financials → ledger_entries auto-sync
-- =====================================================

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
  -- Only process expense/income records that don't already have a ledger link
  IF NEW.reference_type = 'ledger_synced' THEN
    RETURN NEW;
  END IF;

  -- Get MC from property
  SELECT management_company_id INTO v_mc_id
  FROM properties WHERE id = NEW.property_id;

  -- Find or create expense account for this MC
  IF v_mc_id IS NOT NULL THEN
    SELECT id INTO v_expense_account_id
    FROM ledger_accounts
    WHERE management_company_id = v_mc_id
      AND account_type = 'expense'
      AND is_active = true
    LIMIT 1;

    -- Create if missing
    IF v_expense_account_id IS NULL THEN
      INSERT INTO ledger_accounts (account_type, management_company_id, currency)
      VALUES ('expense', v_mc_id, COALESCE(NEW.currency, 'THB'))
      RETURNING id INTO v_expense_account_id;
    END IF;

    -- Find owner payout account
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
        v_expense_account_id,
        v_owner_account_id,
        NEW.amount,
        COALESCE(NEW.currency, 'THB'),
        'property_expense',
        COALESCE(NEW.description, 'Auto-synced from property financials')
      );
    ELSIF NEW.transaction_type = 'income' THEN
      INSERT INTO ledger_entries (
        debit_account_id, credit_account_id, amount, currency,
        entry_type, description
      ) VALUES (
        v_owner_account_id,
        v_expense_account_id,
        NEW.amount,
        COALESCE(NEW.currency, 'THB'),
        'property_income',
        COALESCE(NEW.description, 'Auto-synced from property financials')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_financial_to_ledger ON property_financials;
CREATE TRIGGER trg_sync_financial_to_ledger
  AFTER INSERT ON property_financials
  FOR EACH ROW
  EXECUTE FUNCTION fn_sync_financial_to_ledger();
