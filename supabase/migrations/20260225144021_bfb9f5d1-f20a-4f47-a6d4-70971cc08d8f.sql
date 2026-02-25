
-- Task 1.1: Normalize district trigger
CREATE OR REPLACE FUNCTION normalize_district()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.district IS NOT NULL THEN
    NEW.district = INITCAP(LOWER(TRIM(NEW.district)));
    -- Normalize hyphenated names: "Bang-Tao" -> "Bang Tao", "Nai-Harn" -> "Nai Harn" etc.
    NEW.district = REPLACE(NEW.district, '-', ' ');
    NEW.district = INITCAP(NEW.district);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_normalize_district_properties
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION normalize_district();

CREATE TRIGGER trg_normalize_district_owner_properties
BEFORE INSERT OR UPDATE ON owner_properties
FOR EACH ROW EXECUTE FUNCTION normalize_district();

-- Task 1.2: Constraint to prevent fee > total
-- Use a validation trigger instead of CHECK (more flexible)
CREATE OR REPLACE FUNCTION validate_order_fee()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_amount IS NOT NULL AND NEW.total_amount > 0 
     AND NEW.platform_fee_amount IS NOT NULL 
     AND NEW.platform_fee_amount > NEW.total_amount THEN
    RAISE EXCEPTION 'platform_fee_amount (%) cannot exceed total_amount (%)', 
      NEW.platform_fee_amount, NEW.total_amount;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_order_fee
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION validate_order_fee();
