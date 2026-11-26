CREATE OR REPLACE FUNCTION public.apply_lead_score_event(p_contact_id uuid, p_event_key text, p_source text DEFAULT NULL::text, p_meta jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(contact_id uuid, score_before integer, score_after integer, temperature_before text, temperature_after text, crossed_ready boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_weight       integer;
  v_score_before integer;
  v_score_after  integer;
  v_temp_before  text;
  v_temp_after   text;
  v_company_id   uuid;
BEGIN
  SELECT weight INTO v_weight
    FROM public.lead_score_events
   WHERE event_key = p_event_key AND is_active = true;
  IF v_weight IS NULL THEN
    RAISE EXCEPTION 'Unknown or inactive lead score event: %', p_event_key
      USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(c.lead_score, 0),
         COALESCE(c.lead_temperature, public.lead_temperature_from_score(c.lead_score)),
         c.company_id
    INTO v_score_before, v_temp_before, v_company_id
    FROM public.crm_contacts c
   WHERE c.id = p_contact_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact not found: %', p_contact_id USING ERRCODE = 'P0002';
  END IF;

  -- Signed-in callers must hold CRM edit rights for the contact's company.
  IF auth.uid() IS NOT NULL
     AND NOT public.mc_can_access_e28_private(auth.uid(), v_company_id, 'crm'::text, 'edit'::text) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;

  v_score_after := LEAST(100, GREATEST(0, v_score_before + v_weight));
  v_temp_after  := public.lead_temperature_from_score(v_score_after);

  UPDATE public.crm_contacts
     SET lead_score       = v_score_after,
         lead_temperature = v_temp_after,
         last_activity_at = now(),
         updated_at       = now()
   WHERE id = p_contact_id;

  INSERT INTO public.lead_score_events_log (
    contact_id, event_key, weight_applied,
    score_before, score_after,
    temperature_before, temperature_after,
    source, meta, created_by
  ) VALUES (
    p_contact_id, p_event_key, v_weight,
    v_score_before, v_score_after,
    v_temp_before, v_temp_after,
    p_source, COALESCE(p_meta, '{}'::jsonb), auth.uid()
  );

  RETURN QUERY SELECT
    p_contact_id, v_score_before, v_score_after,
    v_temp_before, v_temp_after,
    (v_temp_before <> 'ready' AND v_temp_after = 'ready');
END;
$function$;

CREATE OR REPLACE FUNCTION public.apply_referral_code(p_referred_id uuid, p_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_id UUID;
  v_settings RECORD;
BEGIN
  -- Signed-in callers may only claim a referral for themselves.
  IF auth.uid() IS NOT NULL AND p_referred_id IS DISTINCT FROM auth.uid() THEN
    RETURN FALSE;
  END IF;

  SELECT user_id INTO v_referrer_id
  FROM public.referral_codes
  WHERE code = UPPER(p_code) AND is_active = true;

  IF v_referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_referrer_id = p_referred_id THEN
    RETURN FALSE;
  END IF;

  IF EXISTS(SELECT 1 FROM public.referrals WHERE referred_id = p_referred_id) THEN
    RETURN FALSE;
  END IF;

  SELECT referrer_bonus, referred_bonus INTO v_settings
  FROM public.referral_settings WHERE is_active = true LIMIT 1;

  INSERT INTO public.referrals (referrer_id, referred_id, referrer_bonus, referred_bonus, status)
  VALUES (v_referrer_id, p_referred_id, COALESCE(v_settings.referrer_bonus, 100), COALESCE(v_settings.referred_bonus, 50), 'pending');

  RETURN TRUE;
END;
$function$;