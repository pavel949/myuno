
-- Auto-sync management_companies.properties_count
CREATE OR REPLACE FUNCTION public.update_mc_properties_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update old company count
  IF TG_OP = 'UPDATE' AND OLD.management_company_id IS DISTINCT FROM NEW.management_company_id THEN
    IF OLD.management_company_id IS NOT NULL THEN
      UPDATE management_companies
        SET properties_count = (SELECT count(*) FROM properties WHERE management_company_id = OLD.management_company_id)
        WHERE id = OLD.management_company_id;
    END IF;
  END IF;

  -- Update new/current company count
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.management_company_id IS NOT NULL THEN
      UPDATE management_companies
        SET properties_count = (SELECT count(*) FROM properties WHERE management_company_id = NEW.management_company_id)
        WHERE id = NEW.management_company_id;
    END IF;
  END IF;

  -- On delete update old company
  IF TG_OP = 'DELETE' THEN
    IF OLD.management_company_id IS NOT NULL THEN
      UPDATE management_companies
        SET properties_count = (SELECT count(*) FROM properties WHERE management_company_id = OLD.management_company_id)
        WHERE id = OLD.management_company_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mc_properties_count
  AFTER INSERT OR UPDATE OF management_company_id OR DELETE
  ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mc_properties_count();
