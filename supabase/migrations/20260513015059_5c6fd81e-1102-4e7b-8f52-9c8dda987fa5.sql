
-- 1. Defensive auto-score trigger (skip when crm_score_log table not present)
CREATE OR REPLACE FUNCTION public.trg_auto_score_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF to_regclass('public.crm_score_log') IS NOT NULL THEN
    DELETE FROM crm_score_log WHERE contact_id = NEW.id;
  END IF;
  IF to_regprocedure('public.recalculate_contact_score(uuid)') IS NOT NULL THEN
    PERFORM recalculate_contact_score(NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Drop the old strict unique index that doesn't account for is_archived
DROP INDEX IF EXISTS public.idx_crm_contacts_company_phone;

-- 3. Phone normalization helper + trigger
CREATE OR REPLACE FUNCTION public.normalize_phone_text(p text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  digits text;
  has_plus boolean;
BEGIN
  IF p IS NULL THEN RETURN NULL; END IF;
  IF btrim(p) = '' THEN RETURN NULL; END IF;
  has_plus := left(btrim(p), 1) = '+';
  digits := regexp_replace(p, '\D', '', 'g');
  IF length(digits) < 7 THEN RETURN NULL; END IF;
  IF NOT has_plus AND length(digits) = 11 AND left(digits, 1) = '8' THEN
    RETURN '+7' || substring(digits, 2);
  END IF;
  IF has_plus THEN
    RETURN '+' || digits;
  END IF;
  RETURN digits;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_contacts_normalize_phone()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.phone IS NOT NULL THEN
    NEW.phone := public.normalize_phone_text(NEW.phone);
  END IF;
  IF NEW.mobile IS NOT NULL THEN
    NEW.mobile := public.normalize_phone_text(NEW.mobile);
  END IF;
  IF NEW.whatsapp IS NOT NULL THEN
    NEW.whatsapp := public.normalize_phone_text(NEW.whatsapp);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_contacts_normalize_phone ON public.crm_contacts;
CREATE TRIGGER trg_crm_contacts_normalize_phone
BEFORE INSERT OR UPDATE OF phone, mobile, whatsapp ON public.crm_contacts
FOR EACH ROW EXECUTE FUNCTION public.crm_contacts_normalize_phone();
