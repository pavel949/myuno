
-- ====================================================
-- P0 BLOCKER 1: Auto-task trigger on property_bookings
-- ====================================================

CREATE OR REPLACE FUNCTION public.auto_create_booking_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_title text;
  v_cleaning_date date;
BEGIN
  -- Only fire on confirmed bookings (insert or status change to confirmed)
  IF NEW.status != 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Skip if old row was already confirmed (avoid duplicates on update)
  IF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Get property title for task descriptions
  SELECT COALESCE(op.title, p.title_en, 'Property')
  INTO v_property_title
  FROM properties p
  LEFT JOIN owner_properties op ON op.id = p.id
  WHERE p.id = NEW.property_id
  LIMIT 1;

  -- 1. Cleaning task: day before check-in (or check-in day if tomorrow)
  v_cleaning_date := GREATEST(NEW.check_in - 1, CURRENT_DATE);

  INSERT INTO property_operational_tasks
    (property_id, booking_id, task_type, title, title_ru, scheduled_date, priority, status)
  VALUES
    (NEW.property_id, NEW.id, 'cleaning',
     'Pre-arrival cleaning: ' || COALESCE(NEW.guest_name, 'Guest'),
     'Уборка перед заездом: ' || COALESCE(NEW.guest_name, 'Гость'),
     v_cleaning_date, 'high', 'pending')
  ON CONFLICT DO NOTHING;

  -- 2. Check-in task
  INSERT INTO property_operational_tasks
    (property_id, booking_id, task_type, title, title_ru, scheduled_date, priority, status)
  VALUES
    (NEW.property_id, NEW.id, 'check_in',
     'Check-in: ' || COALESCE(NEW.guest_name, 'Guest'),
     'Заезд: ' || COALESCE(NEW.guest_name, 'Гость'),
     NEW.check_in, 'high', 'pending')
  ON CONFLICT DO NOTHING;

  -- 3. Check-out task
  INSERT INTO property_operational_tasks
    (property_id, booking_id, task_type, title, title_ru, scheduled_date, priority, status)
  VALUES
    (NEW.property_id, NEW.id, 'check_out',
     'Check-out: ' || COALESCE(NEW.guest_name, 'Guest'),
     'Выезд: ' || COALESCE(NEW.guest_name, 'Гость'),
     NEW.check_out, 'normal', 'pending')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_auto_create_booking_tasks ON property_bookings;
CREATE TRIGGER trg_auto_create_booking_tasks
  AFTER INSERT OR UPDATE ON property_bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_booking_tasks();


-- ====================================================
-- P0 BLOCKER 2: Deposit liability account in ledger
-- ====================================================

-- Update record_ledger_entries to handle deposit_liability
-- We add a standalone function to record deposit entries
CREATE OR REPLACE FUNCTION public.record_deposit_ledger_entry(
  p_booking_id uuid,
  p_property_id uuid,
  p_amount numeric,
  p_currency text DEFAULT 'THB',
  p_entry_type text DEFAULT 'deposit_received'  -- deposit_received | deposit_returned | deposit_deducted
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deposit_account_id uuid;
  v_guest_account_id uuid;
  v_owner_id uuid;
  v_guest_id uuid;
  v_mc_id uuid;
BEGIN
  -- Get booking context
  SELECT pb.owner_id, pb.guest_id, p.management_company_id
  INTO v_owner_id, v_guest_id, v_mc_id
  FROM property_bookings pb
  JOIN properties p ON p.id = pb.property_id
  WHERE pb.id = p_booking_id;

  -- Get or create deposit_liability account for this MC or owner
  IF v_mc_id IS NOT NULL THEN
    SELECT id INTO v_deposit_account_id FROM ledger_accounts
    WHERE management_company_id = v_mc_id AND account_type = 'deposit_liability' LIMIT 1;
    IF v_deposit_account_id IS NULL THEN
      INSERT INTO ledger_accounts (management_company_id, account_type, currency)
      VALUES (v_mc_id, 'deposit_liability', p_currency)
      RETURNING id INTO v_deposit_account_id;
    END IF;
  ELSE
    SELECT id INTO v_deposit_account_id FROM ledger_accounts
    WHERE owner_user_id = v_owner_id AND account_type = 'deposit_liability' LIMIT 1;
    IF v_deposit_account_id IS NULL THEN
      INSERT INTO ledger_accounts (owner_user_id, account_type, currency)
      VALUES (v_owner_id, 'deposit_liability', p_currency)
      RETURNING id INTO v_deposit_account_id;
    END IF;
  END IF;

  -- Get or create guest account
  IF v_guest_id IS NOT NULL THEN
    SELECT id INTO v_guest_account_id FROM ledger_accounts
    WHERE owner_user_id = v_guest_id AND account_type = 'customer' LIMIT 1;
    IF v_guest_account_id IS NULL THEN
      INSERT INTO ledger_accounts (owner_user_id, account_type, currency)
      VALUES (v_guest_id, 'customer', p_currency)
      RETURNING id INTO v_guest_account_id;
    END IF;
  END IF;

  -- Skip if no guest account
  IF v_guest_account_id IS NULL THEN
    RETURN;
  END IF;

  IF p_entry_type = 'deposit_received' THEN
    -- Debit guest, credit deposit liability (we hold their money)
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, entry_type, description)
    VALUES (v_guest_account_id, v_deposit_account_id, p_amount, p_currency, 'deposit_received',
            'Security deposit received for booking ' || p_booking_id::text);
  ELSIF p_entry_type = 'deposit_returned' THEN
    -- Debit deposit liability, credit guest (return money)
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, entry_type, description)
    VALUES (v_deposit_account_id, v_guest_account_id, p_amount, p_currency, 'deposit_returned',
            'Security deposit returned for booking ' || p_booking_id::text);
  ELSIF p_entry_type = 'deposit_deducted' THEN
    -- Debit deposit liability, credit platform/owner (damage deduction)
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, entry_type, description)
    VALUES (v_deposit_account_id, v_deposit_account_id, p_amount, p_currency, 'deposit_deducted',
            'Deposit deduction for damages - booking ' || p_booking_id::text);
  END IF;
END;
$$;


-- ====================================================
-- P0 BLOCKER 3: RLS hardening for MC manager access
-- ====================================================

-- Fix property_financials: MC members need INSERT/UPDATE too, not just SELECT
-- First drop the duplicate SELECT policy
DROP POLICY IF EXISTS "Owners can view their financials" ON property_financials;

-- Add UPDATE policy for owners
CREATE POLICY "Owners can update financials"
  ON property_financials FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Add full CRUD for MC members on their managed properties
DROP POLICY IF EXISTS "mc_members_view_property_financials" ON property_financials;
CREATE POLICY "mc_members_crud_property_financials"
  ON property_financials FOR ALL
  USING (
    owner_id = auth.uid()
    OR property_id IN (
      SELECT p.id FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR property_id IN (
      SELECT p.id FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );

-- Fix property_operational_tasks: MC members need access too
DROP POLICY IF EXISTS "Owners can manage operational tasks" ON property_operational_tasks;
CREATE POLICY "owners_and_mc_manage_operational_tasks"
  ON property_operational_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM owner_properties
      WHERE owner_properties.id = property_operational_tasks.property_id
        AND owner_properties.owner_id = auth.uid()
    )
    OR property_id IN (
      SELECT p.id FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM owner_properties
      WHERE owner_properties.id = property_operational_tasks.property_id
        AND owner_properties.owner_id = auth.uid()
    )
    OR property_id IN (
      SELECT p.id FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );


-- ====================================================
-- P0 BLOCKER 5: Add property_reports auto_send columns
-- ====================================================

-- Add columns for automated monthly statement scheduling
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'property_reports' AND column_name = 'auto_generated'
  ) THEN
    ALTER TABLE property_reports ADD COLUMN auto_generated boolean DEFAULT false;
  END IF;
END$$;
