
CREATE OR REPLACE FUNCTION public.sync_investment_deal_to_capital_crm()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owner_id uuid;
  v_contact_id uuid;
  v_pipeline_stage text;
  v_amount_thb numeric;
  v_probability integer;
  v_first_name text;
  v_last_name text;
BEGIN
  v_owner_id := public.get_capital_crm_owner();
  IF v_owner_id IS NULL THEN RETURN NEW; END IF;

  v_first_name := split_part(COALESCE(NEW.submitter_name, ''), ' ', 1);
  v_last_name := NULLIF(trim(substring(COALESCE(NEW.submitter_name, '') FROM position(' ' IN COALESCE(NEW.submitter_name, '') || ' ') + 1)), '');

  IF NEW.submitter_email IS NOT NULL AND NEW.submitter_email <> '' THEN
    SELECT id INTO v_contact_id
    FROM public.capital_contacts
    WHERE user_id = v_owner_id AND lower(email) = lower(NEW.submitter_email)
    LIMIT 1;
  END IF;

  IF v_contact_id IS NULL AND NEW.submitter_whatsapp IS NOT NULL THEN
    SELECT id INTO v_contact_id
    FROM public.capital_contacts
    WHERE user_id = v_owner_id AND whatsapp = NEW.submitter_whatsapp
    LIMIT 1;
  END IF;

  IF v_contact_id IS NULL THEN
    INSERT INTO public.capital_contacts (
      user_id, first_name, last_name, email, whatsapp, company_name,
      contact_type, source, status, notes, origin_investment_deal_id,
      investor_profile, tags
    ) VALUES (
      v_owner_id,
      COALESCE(NULLIF(v_first_name, ''), 'Unknown'),
      v_last_name,
      NEW.submitter_email,
      NEW.submitter_whatsapp,
      NEW.submitter_company,
      'project_owner',
      'investment_hub:' || NEW.deal_intent::text,
      'active',
      'Auto-created from Investment Hub deal: ' || COALESCE(NEW.title_private, 'Untitled'),
      NEW.id,
      jsonb_build_object(
        'role', NEW.submitter_role,
        'telegram', NEW.submitter_telegram,
        'deal_intent', NEW.deal_intent,
        'category', NEW.category
      ),
      ARRAY['investment_hub', NEW.deal_intent::text, NEW.category]::text[]
    )
    RETURNING id INTO v_contact_id;
  ELSE
    UPDATE public.capital_contacts SET
      whatsapp = COALESCE(whatsapp, NEW.submitter_whatsapp),
      company_name = COALESCE(company_name, NEW.submitter_company),
      origin_investment_deal_id = COALESCE(origin_investment_deal_id, NEW.id),
      tags = ARRAY(SELECT DISTINCT unnest(COALESCE(tags, ARRAY[]::text[]) || ARRAY['investment_hub', NEW.deal_intent::text, NEW.category]::text[])),
      updated_at = now()
    WHERE id = v_contact_id;
  END IF;

  v_pipeline_stage := CASE NEW.status
    WHEN 'submitted'         THEN 'lead'
    WHEN 'under_review'      THEN 'qualified'
    WHEN 'anonymized'        THEN 'qualified'
    WHEN 'published'         THEN 'viewing'
    WHEN 'interest_received' THEN 'reservation'
    WHEN 'matched'           THEN 'reservation'
    WHEN 'term_sheet'        THEN 'contract'
    WHEN 'closed'            THEN 'closed_won'
    WHEN 'dead'              THEN 'closed_lost'
    ELSE 'lead'
  END;

  v_amount_thb := COALESCE(NEW.deal_size_midpoint_usd, 0) * 36;
  v_probability := COALESCE(NEW.probability_score, 30);

  INSERT INTO public.capital_pipeline (
    user_id, contact_id, stage, amount, probability, currency,
    notes, won, investment_deal_id,
    deal_intent, deal_category, source_kind
  ) VALUES (
    v_owner_id, v_contact_id, v_pipeline_stage, v_amount_thb, v_probability, 'THB',
    'Investment Hub: ' || COALESCE(NEW.title_private, 'Untitled') ||
      E'\n' || COALESCE(LEFT(NEW.description_private, 500), ''),
    NEW.status = 'closed',
    NEW.id,
    NEW.deal_intent,
    NEW.category,
    'investment_hub_deal'
  )
  ON CONFLICT (investment_deal_id) WHERE investment_deal_id IS NOT NULL DO UPDATE SET
    stage = EXCLUDED.stage,
    amount = EXCLUDED.amount,
    probability = EXCLUDED.probability,
    won = EXCLUDED.won,
    updated_at = now();

  RETURN NEW;
END;
$function$;
