
CREATE OR REPLACE FUNCTION public.sync_investment_deal_to_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_contact_id uuid;
BEGIN
  IF NEW.submitter_email IS NULL OR NEW.submitter_email = '' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_contact_id FROM public.crm_contacts
   WHERE lower(email) = lower(NEW.submitter_email) LIMIT 1;

  IF v_contact_id IS NULL THEN
    INSERT INTO public.crm_contacts (
      first_name, email, phone, company_name, source, contact_type, lifecycle_stage, tags
    ) VALUES (
      NEW.submitter_name,
      NEW.submitter_email,
      NEW.submitter_whatsapp,
      NEW.submitter_company,
      'investment_deal:' || NEW.deal_intent::text,
      'lead',
      'lead',
      ARRAY['investment_hub', NEW.category, NEW.deal_intent::text]
    )
    RETURNING id INTO v_contact_id;
  END IF;

  RETURN NEW;
END;
$function$;
