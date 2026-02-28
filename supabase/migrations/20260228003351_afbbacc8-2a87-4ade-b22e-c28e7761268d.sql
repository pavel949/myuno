
-- Phase 1A: Add columns and migrate data
ALTER TABLE properties ADD COLUMN IF NOT EXISTS marketplace_property_id uuid;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS managed_by uuid;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS plot_size_sqm numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_elevator boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pool_type text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS garden_type text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_for_sale boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sale_currency text DEFAULT 'THB';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approved_by uuid;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS instant_booking_enabled_at timestamptz;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS security_deposit_collection text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pm_company_id uuid;

-- Migrate 5 PMS-only rows
INSERT INTO properties (
  id, owner_id, title_en, title_ru, address, district, property_type,
  bedrooms, bathrooms, area_sqm, description_en, description_ru,
  cover_image, images, management_type, is_rented, rental_platform,
  status, verified_at, verified_by, notes, created_at, updated_at,
  price_per_night, min_stay_nights, max_guests, deposit_amount,
  deposit_currency, check_in_time, check_out_time, house_rules,
  house_rules_ru, cancellation_policy, instant_booking,
  seasonal_pricing, weekly_discount, monthly_discount, deposit_type,
  electricity_included, electricity_unit_price, electricity_provider,
  electricity_metering, electricity_notes, electricity_notes_ru,
  water_included, water_unit_price, water_notes, water_notes_ru,
  included_services, extra_services, cleaning_included,
  cleaning_frequency, extra_cleaning_price, linen_change_price,
  linen_change_frequency, marketplace_property_id, listing_type,
  title, management_company_id
)
SELECT
  op.id, op.owner_id, op.title, op.title_ru, op.address, op.district, op.property_type,
  op.bedrooms, op.bathrooms, op.area_sqm, op.description, op.description_ru,
  op.cover_image, op.images, op.management_type, op.is_rented, op.rental_platform,
  op.status, op.verified_at, op.verified_by, op.notes, op.created_at, op.updated_at,
  op.price_per_night, op.min_stay_nights, op.max_guests, op.deposit_amount,
  op.deposit_currency, op.check_in_time, op.check_out_time, op.house_rules,
  op.house_rules_ru, op.cancellation_policy, op.instant_booking,
  op.seasonal_pricing, op.weekly_discount, op.monthly_discount, op.deposit_type,
  op.electricity_included, op.electricity_unit_price, op.electricity_provider,
  op.electricity_metering, op.electricity_notes, op.electricity_notes_ru,
  op.water_included, op.water_unit_price, op.water_notes, op.water_notes_ru,
  op.included_services, op.extra_services, op.cleaning_included,
  op.cleaning_frequency, op.extra_cleaning_price, op.linen_change_price,
  op.linen_change_frequency, op.marketplace_property_id, 'rent',
  op.title, op.management_company_id
FROM owner_properties op
WHERE NOT EXISTS (SELECT 1 FROM properties p WHERE p.id = op.id)
ON CONFLICT (id) DO NOTHING;

-- Re-point ALL 32 foreign keys
ALTER TABLE property_guidebook DROP CONSTRAINT IF EXISTS property_guidebook_property_id_fkey;
ALTER TABLE property_guidebook ADD CONSTRAINT property_guidebook_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_service_requests DROP CONSTRAINT IF EXISTS property_service_requests_property_id_fkey;
ALTER TABLE property_service_requests ADD CONSTRAINT property_service_requests_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_financials DROP CONSTRAINT IF EXISTS property_financials_property_id_fkey;
ALTER TABLE property_financials ADD CONSTRAINT property_financials_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_bookings DROP CONSTRAINT IF EXISTS property_bookings_property_id_fkey;
ALTER TABLE property_bookings ADD CONSTRAINT property_bookings_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_chat_messages DROP CONSTRAINT IF EXISTS property_chat_messages_property_id_fkey;
ALTER TABLE property_chat_messages ADD CONSTRAINT property_chat_messages_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_external_calendars DROP CONSTRAINT IF EXISTS property_external_calendars_property_id_fkey;
ALTER TABLE property_external_calendars ADD CONSTRAINT property_external_calendars_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_documents DROP CONSTRAINT IF EXISTS property_documents_property_id_fkey;
ALTER TABLE property_documents ADD CONSTRAINT property_documents_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE juristic_contacts DROP CONSTRAINT IF EXISTS juristic_contacts_property_id_fkey;
ALTER TABLE juristic_contacts ADD CONSTRAINT juristic_contacts_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE juristic_requests DROP CONSTRAINT IF EXISTS juristic_requests_property_id_fkey;
ALTER TABLE juristic_requests ADD CONSTRAINT juristic_requests_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_availability DROP CONSTRAINT IF EXISTS property_availability_property_id_fkey;
ALTER TABLE property_availability ADD CONSTRAINT property_availability_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_delegates DROP CONSTRAINT IF EXISTS property_delegates_property_id_fkey;
ALTER TABLE property_delegates ADD CONSTRAINT property_delegates_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_activity_log DROP CONSTRAINT IF EXISTS property_activity_log_property_id_fkey;
ALTER TABLE property_activity_log ADD CONSTRAINT property_activity_log_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_meters DROP CONSTRAINT IF EXISTS property_meters_property_id_fkey;
ALTER TABLE property_meters ADD CONSTRAINT property_meters_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_ownership_invites DROP CONSTRAINT IF EXISTS property_ownership_invites_property_id_fkey;
ALTER TABLE property_ownership_invites ADD CONSTRAINT property_ownership_invites_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE owner_notifications DROP CONSTRAINT IF EXISTS owner_notifications_property_id_fkey;
ALTER TABLE owner_notifications ADD CONSTRAINT owner_notifications_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_deposits DROP CONSTRAINT IF EXISTS property_deposits_property_id_fkey;
ALTER TABLE property_deposits ADD CONSTRAINT property_deposits_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE meter_readings DROP CONSTRAINT IF EXISTS meter_readings_property_id_fkey;
ALTER TABLE meter_readings ADD CONSTRAINT meter_readings_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_inventory_items DROP CONSTRAINT IF EXISTS property_inventory_items_property_id_fkey;
ALTER TABLE property_inventory_items ADD CONSTRAINT property_inventory_items_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE damage_reports DROP CONSTRAINT IF EXISTS damage_reports_property_id_fkey;
ALTER TABLE damage_reports ADD CONSTRAINT damage_reports_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_operational_tasks DROP CONSTRAINT IF EXISTS property_operational_tasks_property_id_fkey;
ALTER TABLE property_operational_tasks ADD CONSTRAINT property_operational_tasks_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_management_terms DROP CONSTRAINT IF EXISTS property_management_terms_property_id_fkey;
ALTER TABLE property_management_terms ADD CONSTRAINT property_management_terms_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE chat_message_flags DROP CONSTRAINT IF EXISTS chat_message_flags_property_id_fkey;
ALTER TABLE chat_message_flags ADD CONSTRAINT chat_message_flags_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE inventory_inspections DROP CONSTRAINT IF EXISTS inventory_inspections_property_id_fkey;
ALTER TABLE inventory_inspections ADD CONSTRAINT inventory_inspections_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE ota_listing_connections DROP CONSTRAINT IF EXISTS ota_listing_connections_property_id_fkey;
ALTER TABLE ota_listing_connections ADD CONSTRAINT ota_listing_connections_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_management_requests DROP CONSTRAINT IF EXISTS property_management_requests_property_id_fkey;
ALTER TABLE property_management_requests ADD CONSTRAINT property_management_requests_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_reports DROP CONSTRAINT IF EXISTS property_reports_property_id_fkey;
ALTER TABLE property_reports ADD CONSTRAINT property_reports_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE calendar_sync_logs DROP CONSTRAINT IF EXISTS calendar_sync_logs_property_id_fkey;
ALTER TABLE calendar_sync_logs ADD CONSTRAINT calendar_sync_logs_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_analytics DROP CONSTRAINT IF EXISTS property_analytics_property_id_fkey;
ALTER TABLE property_analytics ADD CONSTRAINT property_analytics_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_promotions DROP CONSTRAINT IF EXISTS property_promotions_property_id_fkey;
ALTER TABLE property_promotions ADD CONSTRAINT property_promotions_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_listing_scores DROP CONSTRAINT IF EXISTS property_listing_scores_property_id_fkey;
ALTER TABLE property_listing_scores ADD CONSTRAINT property_listing_scores_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_budgets DROP CONSTRAINT IF EXISTS property_budgets_property_id_fkey;
ALTER TABLE property_budgets ADD CONSTRAINT property_budgets_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_maintenance_schedules DROP CONSTRAINT IF EXISTS property_maintenance_schedules_property_id_fkey;
ALTER TABLE property_maintenance_schedules ADD CONSTRAINT property_maintenance_schedules_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- Update triggers to query only properties
CREATE OR REPLACE FUNCTION fn_auto_expense_on_task_done()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner_id uuid; v_financial_id uuid;
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done')
     AND COALESCE(NEW.actual_cost, 0) > 0 AND NEW.expense_created IS NOT TRUE THEN
    SELECT owner_id INTO v_owner_id FROM properties WHERE id = NEW.property_id;
    IF v_owner_id IS NULL THEN RETURN NEW; END IF;
    INSERT INTO property_financials (property_id, owner_id, transaction_type, category, amount, currency, description, reference_type, reference_id, transaction_date, status, cost_source)
    VALUES (NEW.property_id, v_owner_id, 'expense',
      CASE NEW.task_type WHEN 'maintenance' THEN 'maintenance' WHEN 'cleaning' THEN 'cleaning' ELSE 'operations' END,
      NEW.actual_cost, COALESCE(NEW.cost_currency, 'THB'), COALESCE(NEW.title, 'Operational task expense'),
      'operational_task', NEW.id, COALESCE(NEW.completed_at::date, CURRENT_DATE), 'recorded', 'auto_task')
    RETURNING id INTO v_financial_id;
    NEW.expense_created := true;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION fn_sync_financial_to_ledger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_mc_id uuid; v_expense_account_id uuid; v_owner_account_id uuid;
BEGIN
  IF NEW.reference_type = 'ledger_synced' THEN RETURN NEW; END IF;
  SELECT management_company_id INTO v_mc_id FROM properties WHERE id = NEW.property_id;
  IF v_mc_id IS NOT NULL THEN
    SELECT id INTO v_expense_account_id FROM ledger_accounts WHERE management_company_id = v_mc_id AND account_type = 'expense' AND is_active = true LIMIT 1;
    IF v_expense_account_id IS NULL THEN
      INSERT INTO ledger_accounts (account_type, management_company_id, currency) VALUES ('expense', v_mc_id, COALESCE(NEW.currency, 'THB')) RETURNING id INTO v_expense_account_id;
    END IF;
    SELECT id INTO v_owner_account_id FROM ledger_accounts WHERE owner_user_id = NEW.owner_id AND account_type = 'owner_payout' AND is_active = true LIMIT 1;
    IF v_owner_account_id IS NULL THEN
      INSERT INTO ledger_accounts (account_type, owner_user_id, currency) VALUES ('owner_payout', NEW.owner_id, COALESCE(NEW.currency, 'THB')) RETURNING id INTO v_owner_account_id;
    END IF;
    IF NEW.transaction_type = 'expense' THEN
      INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, entry_type, description)
      VALUES (v_expense_account_id, v_owner_account_id, NEW.amount, COALESCE(NEW.currency, 'THB'), 'property_expense', COALESCE(NEW.description, 'Auto-synced'));
    ELSIF NEW.transaction_type = 'income' THEN
      INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, entry_type, description)
      VALUES (v_owner_account_id, v_expense_account_id, NEW.amount, COALESCE(NEW.currency, 'THB'), 'property_income', COALESCE(NEW.description, 'Auto-synced'));
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- Create v_owner_properties compatibility view
CREATE OR REPLACE VIEW v_owner_properties AS SELECT * FROM properties WHERE owner_id IS NOT NULL;
