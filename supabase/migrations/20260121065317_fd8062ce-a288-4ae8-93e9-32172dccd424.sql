-- Исправление search_path для функции
CREATE OR REPLACE FUNCTION generate_juristic_request_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.request_number := 'JR-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
    LPAD(NEXTVAL('juristic_request_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

-- Расширение property_projects juristic полями
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_person_name TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_person_name_ru TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_email TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_phone TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_line_id TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_whatsapp TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_address TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_office_hours TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_contact_person TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_contact_position TEXT;

-- Платёжные реквизиты juristic person
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_bank_name TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_bank_account_name TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_bank_account_number TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_promptpay_id TEXT;

-- CAM информация
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS cam_fee_per_sqm NUMERIC;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS cam_payment_day INTEGER;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS cam_includes TEXT[];