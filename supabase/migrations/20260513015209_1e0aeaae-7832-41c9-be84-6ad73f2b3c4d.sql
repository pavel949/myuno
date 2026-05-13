
-- Partial unique indexes (only enforce on active contacts)
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_contacts_active_company_phone
  ON public.crm_contacts (company_id, phone)
  WHERE is_archived = false AND phone IS NOT NULL AND phone <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_contacts_active_company_email
  ON public.crm_contacts (company_id, lower(email))
  WHERE is_archived = false AND email IS NOT NULL AND email <> '';

-- Autolink trigger: ensure every agent_deal has contact_id
CREATE OR REPLACE FUNCTION public.agent_deals_autolink_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  found_id uuid;
  norm_phone text;
  norm_email text;
  fname text;
  lname text;
  parts text[];
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.company_id IS NULL THEN
    RETURN NEW;
  END IF;

  norm_phone := public.normalize_phone_text(NEW.client_phone);
  norm_email := CASE WHEN NEW.client_email IS NOT NULL AND NEW.client_email <> ''
                     THEN lower(btrim(NEW.client_email)) END;

  -- Try phone match
  IF norm_phone IS NOT NULL THEN
    SELECT id INTO found_id FROM crm_contacts
    WHERE company_id = NEW.company_id AND is_archived = false AND phone = norm_phone
    LIMIT 1;
  END IF;

  -- Try email match
  IF found_id IS NULL AND norm_email IS NOT NULL THEN
    SELECT id INTO found_id FROM crm_contacts
    WHERE company_id = NEW.company_id AND is_archived = false AND lower(email) = norm_email
    LIMIT 1;
  END IF;

  -- Create contact if nothing found and we have at least a name or phone or email
  IF found_id IS NULL AND (NEW.client_name IS NOT NULL OR norm_phone IS NOT NULL OR norm_email IS NOT NULL) THEN
    parts := regexp_split_to_array(btrim(COALESCE(NEW.client_name, '')), '\s+');
    fname := COALESCE(NULLIF(parts[1], ''), 'Unknown');
    lname := CASE WHEN array_length(parts, 1) > 1
                  THEN array_to_string(parts[2:array_length(parts, 1)], ' ')
                  ELSE NULL END;

    INSERT INTO crm_contacts (
      company_id, first_name, last_name, phone, email, source, created_by, lifecycle_stage
    ) VALUES (
      NEW.company_id, fname, lname, norm_phone, norm_email,
      COALESCE(NEW.client_source, 'deal_autolink'), NEW.assigned_to, 'lead'
    )
    RETURNING id INTO found_id;
  END IF;

  IF found_id IS NOT NULL THEN
    NEW.contact_id := found_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agent_deals_autolink_contact ON public.agent_deals;
CREATE TRIGGER trg_agent_deals_autolink_contact
BEFORE INSERT ON public.agent_deals
FOR EACH ROW EXECUTE FUNCTION public.agent_deals_autolink_contact();
