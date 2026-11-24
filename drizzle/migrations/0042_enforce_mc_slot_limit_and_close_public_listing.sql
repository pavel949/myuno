CREATE OR REPLACE FUNCTION public.enforce_mc_property_slot_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_limit integer; v_used integer;
BEGIN
  IF NEW.is_active IS NOT TRUE THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_active IS TRUE AND OLD.company_id = NEW.company_id THEN RETURN NEW; END IF;
  SELECT COALESCE(paid_slots,0) + COALESCE(free_slots,0) INTO v_limit
    FROM public.management_companies WHERE id = NEW.company_id FOR UPDATE;
  SELECT count(*) INTO v_used FROM public.mc_property_slots
    WHERE company_id = NEW.company_id AND is_active IS TRUE AND id <> NEW.id;
  IF v_used >= COALESCE(v_limit,0) THEN
    RAISE EXCEPTION 'No available property slots for this company' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enforce_mc_property_slot_limit() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_enforce_mc_property_slot_limit ON public.mc_property_slots;
CREATE TRIGGER trg_enforce_mc_property_slot_limit BEFORE INSERT OR UPDATE ON public.mc_property_slots
  FOR EACH ROW EXECUTE FUNCTION public.enforce_mc_property_slot_limit();

DROP POLICY IF EXISTS "Public read intake-uploads (no list)" ON storage.objects;
DROP POLICY IF EXISTS "Public read property-care (no list)" ON storage.objects;