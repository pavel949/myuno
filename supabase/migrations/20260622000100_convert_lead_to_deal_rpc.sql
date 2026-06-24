-- Fix #2: lead → deal bridge.
--
-- Until now consultation_requests.converted_deal_id (added by
-- 20260312000000_lead_to_deal_conversion.sql) was never written by application
-- code: there was no path to turn a platform inbound lead into an MC agent_deal.
-- Leads were retyped by hand. This RPC closes that gap atomically.
--
-- convert_lead_to_deal(lead, company, agent, deal_type):
--   1. Authorizes caller (platform admin/uno_team OR active member of the company).
--   2. Idempotent: if the lead already has converted_deal_id, returns it unchanged.
--   3. Finds/creates a crm_contacts row scoped to (company_id, lower(email)),
--      matching the multi-tenant unique index from
--      20260622000000_crm_contacts_company_scoped_email_unique.sql.
--   4. Inserts an agent_deals row in stage 'new' under the chosen company.
--   5. Stamps consultation_requests.converted_deal_id + converted_at.
--
-- SECURITY DEFINER so it can write across crm_contacts / agent_deals /
-- consultation_requests in one transaction after its own authz check.

CREATE OR REPLACE FUNCTION public.convert_lead_to_deal(
  p_lead_id uuid,
  p_company_id uuid,
  p_agent_id uuid DEFAULT auth.uid(),
  p_deal_type text DEFAULT 'sale'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead        public.consultation_requests%ROWTYPE;
  v_contact_id  uuid;
  v_deal_id     uuid;
  v_email       text;
  v_contact_type text;
  v_full_name   text;
BEGIN
  -- AuthZ: platform admin/uno_team, or an active member of the target company.
  IF NOT (public.is_admin_or_uno_team() OR public.is_company_member(auth.uid(), p_company_id)) THEN
    RAISE EXCEPTION 'not authorized to convert leads for this company'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_lead FROM public.consultation_requests
    WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead % not found', p_lead_id USING ERRCODE = 'P0002';
  END IF;

  -- Idempotent: already converted → return the existing deal.
  IF v_lead.converted_deal_id IS NOT NULL THEN
    RETURN v_lead.converted_deal_id;
  END IF;

  v_email := NULLIF(lower(trim(coalesce(v_lead.email, ''))), '');
  v_full_name := coalesce(NULLIF(trim(v_lead.name), ''), 'Unknown');

  -- contact_type mirrors CreateDealSheet's CONTACT_TYPE_BY_DEAL_TYPE map.
  v_contact_type := CASE p_deal_type
    WHEN 'rent_short'  THEN 'tenant'
    WHEN 'rent_long'   THEN 'tenant'
    WHEN 'investment'  THEN 'investor'
    WHEN 'club_deal'   THEN 'investor'
    WHEN 'management'  THEN 'landlord'
    ELSE 'buyer'  -- sale, resale, offplan, anything else
  END;

  -- 1. Find existing contact in THIS company by email; else create one.
  IF v_email IS NOT NULL THEN
    SELECT id INTO v_contact_id FROM public.crm_contacts
      WHERE company_id = p_company_id AND lower(email) = v_email
      LIMIT 1;
  END IF;

  IF v_contact_id IS NULL THEN
    INSERT INTO public.crm_contacts (
      company_id, first_name, last_name, phone, email,
      source, contact_type, language,
      budget_min, budget_max, currency,
      preferred_districts, preferred_types, bedrooms_min,
      created_by
    ) VALUES (
      p_company_id,
      split_part(v_full_name, ' ', 1),
      NULLIF(trim(substr(v_full_name, length(split_part(v_full_name, ' ', 1)) + 1)), ''),
      v_lead.phone,
      v_email,
      coalesce(v_lead.lead_source, 'website'),
      v_contact_type,
      coalesce(v_lead.preferred_language, 'en'),
      v_lead.budget_min, v_lead.budget_max, coalesce(v_lead.currency, 'THB'),
      v_lead.districts, v_lead.property_types, v_lead.bedrooms_min,
      p_agent_id
    )
    RETURNING id INTO v_contact_id;
  END IF;

  -- 2. Create the deal in stage 'new'.
  INSERT INTO public.agent_deals (
    company_id, agent_id, contact_id,
    client_name, client_phone, client_email, client_source,
    stage, deal_type, deal_status,
    budget_min, budget_max, currency,
    preferred_districts, preferred_types, bedrooms_min,
    notes
  ) VALUES (
    p_company_id, p_agent_id, v_contact_id,
    v_full_name, v_lead.phone, v_email, coalesce(v_lead.lead_source, 'website'),
    'new', p_deal_type, 'active',
    v_lead.budget_min, v_lead.budget_max, coalesce(v_lead.currency, 'THB'),
    v_lead.districts, v_lead.property_types, v_lead.bedrooms_min,
    v_lead.notes
  )
  RETURNING id INTO v_deal_id;

  -- 3. Stamp the lead as converted.
  UPDATE public.consultation_requests
    SET converted_deal_id = v_deal_id,
        converted_at = now(),
        updated_at = now()
    WHERE id = p_lead_id;

  RETURN v_deal_id;
END;
$$;

REVOKE ALL ON FUNCTION public.convert_lead_to_deal(uuid, uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.convert_lead_to_deal(uuid, uuid, uuid, text) TO authenticated;
