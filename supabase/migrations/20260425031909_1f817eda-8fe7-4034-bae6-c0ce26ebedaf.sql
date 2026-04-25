-- STAYS → DEALS auto-lead bridge
-- Every confirmed stays booking with a contactable guest auto-creates an
-- agent_deals row (stage='new', source='stays_signal') so Capital can follow
-- up. De-duped per company × guest contact to avoid noise.

CREATE OR REPLACE FUNCTION public.autocreate_capital_lead_from_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_existing_id uuid;
  v_guest_name text;
  v_guest_email text;
  v_guest_phone text;
BEGIN
  -- Only act on confirmed bookings with at least one contact channel.
  IF COALESCE(NEW.status, 'confirmed') NOT IN ('confirmed', 'checked_in', 'checked_out') THEN
    RETURN NEW;
  END IF;

  v_guest_email := NULLIF(TRIM(NEW.guest_email), '');
  v_guest_phone := NULLIF(TRIM(NEW.guest_phone), '');
  v_guest_name  := COALESCE(NULLIF(TRIM(NEW.guest_name), ''), 'Stays guest');

  IF v_guest_email IS NULL AND v_guest_phone IS NULL THEN
    RETURN NEW;
  END IF;

  -- Resolve management company from property → owner mapping.
  SELECT mcm.company_id INTO v_company_id
  FROM public.properties p
  LEFT JOIN public.management_company_members mcm
    ON mcm.user_id = p.owner_id AND mcm.is_active = true
  WHERE p.id = NEW.property_id
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- De-dupe: skip if the same guest already has an open deal in this company.
  SELECT id INTO v_existing_id
  FROM public.agent_deals
  WHERE company_id = v_company_id
    AND deal_status = 'active'
    AND (
      (v_guest_email IS NOT NULL AND lower(client_email) = lower(v_guest_email))
      OR (v_guest_phone IS NOT NULL AND client_phone = v_guest_phone)
    )
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.agent_deals (
    company_id,
    agent_id,
    property_id,
    client_name,
    client_email,
    client_phone,
    client_source,
    deal_source_detail,
    stage,
    deal_type,
    deal_status,
    notes,
    tags,
    next_action,
    next_action_date
  ) VALUES (
    v_company_id,
    NEW.owner_id, -- assign to property owner; can be reassigned in CRM
    NEW.property_id,
    v_guest_name,
    v_guest_email,
    v_guest_phone,
    'stays',
    'stays_signal',
    'new',
    'sale',
    'active',
    'Auto-created from STAYS booking ' || NEW.id::text
      || ' · check-in ' || NEW.check_in::text,
    ARRAY['stays_signal', 'auto'],
    'Qualify as buyer / long-term renter',
    now() + interval '3 days'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_autocreate_capital_lead_from_booking ON public.property_bookings;

CREATE TRIGGER trg_autocreate_capital_lead_from_booking
AFTER INSERT ON public.property_bookings
FOR EACH ROW
EXECUTE FUNCTION public.autocreate_capital_lead_from_booking();

COMMENT ON FUNCTION public.autocreate_capital_lead_from_booking IS
'STAYS→DEALS bridge: turns every contactable stays guest into a capital lead in agent_deals (de-duped per company × guest).';
