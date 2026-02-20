
-- Function to auto-create agent_deal from consultation_request
-- Triggers when a new consultation_request is created with request_type in ('property_tour', 'investment_advice', 'property_purchase')
-- and the linked property belongs to a management company

CREATE OR REPLACE FUNCTION public.auto_create_deal_from_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_property_id uuid;
BEGIN
  -- Only process property-related lead types
  IF NEW.request_type NOT IN ('property_tour', 'investment_advice', 'property_purchase') THEN
    RETURN NEW;
  END IF;

  -- Try to find company via owner_property_id
  IF NEW.owner_property_id IS NOT NULL THEN
    SELECT p.management_company_id, p.id
    INTO v_company_id, v_property_id
    FROM properties p
    WHERE p.id = NEW.owner_property_id
      AND p.management_company_id IS NOT NULL;
  END IF;

  -- Also try via property_ids array
  IF v_company_id IS NULL AND NEW.property_ids IS NOT NULL AND array_length(NEW.property_ids, 1) > 0 THEN
    SELECT p.management_company_id, p.id
    INTO v_company_id, v_property_id
    FROM properties p
    WHERE p.id = (NEW.property_ids[1])::uuid
      AND p.management_company_id IS NOT NULL
    LIMIT 1;
  END IF;

  -- No company found — skip
  IF v_company_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find a default agent (company owner)
  DECLARE v_agent_id uuid;
  BEGIN
    SELECT user_id INTO v_agent_id
    FROM management_company_members
    WHERE company_id = v_company_id AND role = 'owner' AND is_active = true
    LIMIT 1;

    IF v_agent_id IS NULL THEN
      SELECT user_id INTO v_agent_id
      FROM management_company_members
      WHERE company_id = v_company_id AND is_active = true
      LIMIT 1;
    END IF;

    IF v_agent_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Create the deal
    INSERT INTO agent_deals (
      company_id, agent_id, property_id,
      client_name, client_phone, client_email, client_source,
      stage, budget_min, budget_max, currency,
      preferred_districts, preferred_types, bedrooms_min,
      notes
    ) VALUES (
      v_company_id, v_agent_id, v_property_id,
      NEW.name, NEW.phone, NEW.email,
      COALESCE(NEW.lead_source, NEW.entry_point, 'website'),
      'new',
      NEW.budget_min, NEW.budget_max, COALESCE(NEW.currency, 'THB'),
      NEW.districts, NEW.property_types, NEW.bedrooms_min,
      COALESCE(NEW.notes, '') || ' [Auto from lead: ' || NEW.request_type || ']'
    );
  END;

  RETURN NEW;
END;
$$;

-- Trigger on consultation_requests insert
CREATE TRIGGER trg_auto_create_deal_from_lead
  AFTER INSERT ON consultation_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_deal_from_lead();
