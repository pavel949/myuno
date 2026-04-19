
-- 1. Link columns
ALTER TABLE public.capital_pipeline
  ADD COLUMN IF NOT EXISTS investment_deal_id uuid REFERENCES public.investment_deals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS investor_inquiry_id uuid REFERENCES public.investor_inquiries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deal_intent text,
  ADD COLUMN IF NOT EXISTS deal_category text,
  ADD COLUMN IF NOT EXISTS source_kind text DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS idx_capital_pipeline_investment_deal ON public.capital_pipeline(investment_deal_id) WHERE investment_deal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capital_pipeline_investor_inquiry ON public.capital_pipeline(investor_inquiry_id) WHERE investor_inquiry_id IS NOT NULL;

ALTER TABLE public.capital_contacts
  ADD COLUMN IF NOT EXISTS origin_investment_deal_id uuid REFERENCES public.investment_deals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS origin_investor_inquiry_id uuid REFERENCES public.investor_inquiries(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_capital_pipeline_investment_deal
  ON public.capital_pipeline(investment_deal_id)
  WHERE investment_deal_id IS NOT NULL;

-- 2. Owner resolver — system_settings.value is JSONB, extract as text then cast
CREATE OR REPLACE FUNCTION public.get_capital_crm_owner()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(
      (SELECT (value #>> '{}')::text FROM public.system_settings WHERE key = 'capital_crm_owner_user_id' LIMIT 1),
      ''
    )::uuid,
    (SELECT user_id FROM public.user_roles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  );
$$;

-- 3. Investment deal sync trigger
CREATE OR REPLACE FUNCTION public.sync_investment_deal_to_capital_crm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      'investment_hub:' || COALESCE(NEW.deal_intent, 'submission'),
      'active',
      'Auto-created from Investment Hub deal: ' || COALESCE(NEW.title_private, 'Untitled'),
      NEW.id,
      jsonb_build_object(
        'role', NEW.submitter_role,
        'telegram', NEW.submitter_telegram,
        'deal_intent', NEW.deal_intent,
        'category', NEW.category
      ),
      ARRAY['investment_hub', NEW.deal_intent, NEW.category]::text[]
    )
    RETURNING id INTO v_contact_id;
  ELSE
    UPDATE public.capital_contacts SET
      whatsapp = COALESCE(whatsapp, NEW.submitter_whatsapp),
      company_name = COALESCE(company_name, NEW.submitter_company),
      origin_investment_deal_id = COALESCE(origin_investment_deal_id, NEW.id),
      tags = ARRAY(SELECT DISTINCT unnest(COALESCE(tags, ARRAY[]::text[]) || ARRAY['investment_hub', NEW.deal_intent, NEW.category]::text[])),
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
$$;

DROP TRIGGER IF EXISTS trg_sync_investment_deal_to_capital_crm ON public.investment_deals;
CREATE TRIGGER trg_sync_investment_deal_to_capital_crm
  AFTER INSERT OR UPDATE OF status, probability_score, submitter_email, submitter_whatsapp, deal_size_midpoint_usd
  ON public.investment_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_investment_deal_to_capital_crm();

-- 4. Investor inquiry sync trigger
CREATE OR REPLACE FUNCTION public.sync_investor_inquiry_to_capital_crm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_contact_id uuid;
  v_first_name text;
  v_last_name text;
BEGIN
  v_owner_id := public.get_capital_crm_owner();
  IF v_owner_id IS NULL THEN RETURN NEW; END IF;

  v_first_name := split_part(COALESCE(NEW.investor_name, ''), ' ', 1);
  v_last_name := NULLIF(trim(substring(COALESCE(NEW.investor_name, '') FROM position(' ' IN COALESCE(NEW.investor_name, '') || ' ') + 1)), '');

  IF NEW.investor_email IS NOT NULL AND NEW.investor_email <> '' THEN
    SELECT id INTO v_contact_id
    FROM public.capital_contacts
    WHERE user_id = v_owner_id AND lower(email) = lower(NEW.investor_email)
    LIMIT 1;
  END IF;

  IF v_contact_id IS NULL THEN
    INSERT INTO public.capital_contacts (
      user_id, first_name, last_name, email, whatsapp,
      contact_type, source, status, notes, origin_investor_inquiry_id,
      investor_profile, tags
    ) VALUES (
      v_owner_id,
      COALESCE(NULLIF(v_first_name, ''), 'Investor'),
      v_last_name,
      NEW.investor_email,
      NEW.investor_whatsapp,
      'investor',
      'investment_hub:inquiry',
      'active',
      COALESCE(NEW.message, 'Expressed interest via Investment Hub'),
      NEW.id,
      jsonb_build_object(
        'investor_type', NEW.investor_type,
        'investment_capacity_usd', NEW.investment_capacity_usd
      ),
      ARRAY['investment_hub', 'investor', NEW.investor_type]::text[]
    )
    RETURNING id INTO v_contact_id;
  ELSE
    UPDATE public.capital_contacts SET
      contact_type = COALESCE(contact_type, 'investor'),
      whatsapp = COALESCE(whatsapp, NEW.investor_whatsapp),
      origin_investor_inquiry_id = COALESCE(origin_investor_inquiry_id, NEW.id),
      investor_profile = COALESCE(investor_profile, '{}'::jsonb) || jsonb_build_object(
        'investor_type', NEW.investor_type,
        'investment_capacity_usd', NEW.investment_capacity_usd
      ),
      tags = ARRAY(SELECT DISTINCT unnest(COALESCE(tags, ARRAY[]::text[]) || ARRAY['investment_hub', 'investor']::text[])),
      updated_at = now()
    WHERE id = v_contact_id;
  END IF;

  INSERT INTO public.capital_outreach (
    user_id, contact_id, channel, status, subject, body, sent_at
  ) VALUES (
    v_owner_id, v_contact_id, 'email', 'received',
    'Inbound interest: deal ' || NEW.deal_id::text,
    COALESCE(NEW.message, '(no message)') ||
      E'\n— Capacity: $' || COALESCE(NEW.investment_capacity_usd::text, 'n/a') ||
      E'\n— Type: ' || COALESCE(NEW.investor_type::text, 'n/a'),
    now()
  );

  UPDATE public.investment_deals
  SET status = 'interest_received'
  WHERE id = NEW.deal_id AND status IN ('published', 'anonymized');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_investor_inquiry_to_capital_crm ON public.investor_inquiries;
CREATE TRIGGER trg_sync_investor_inquiry_to_capital_crm
  AFTER INSERT ON public.investor_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_investor_inquiry_to_capital_crm();

COMMENT ON FUNCTION public.sync_investment_deal_to_capital_crm IS
  'Syncs investment_deals into existing Ignatev Capital CRM (capital_contacts + capital_pipeline). No parallel CRM.';
COMMENT ON FUNCTION public.sync_investor_inquiry_to_capital_crm IS
  'Syncs investor_inquiries into Ignatev Capital CRM as investors + outreach log. Auto-bumps deal to interest_received.';
