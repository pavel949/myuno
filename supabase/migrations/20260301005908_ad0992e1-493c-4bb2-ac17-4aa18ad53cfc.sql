
-- DB function to recalculate lead score for a contact based on scoring rules
CREATE OR REPLACE FUNCTION public.recalculate_contact_score(p_contact_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_total_score INTEGER := 0;
  v_rule RECORD;
  v_contact RECORD;
  v_points INTEGER;
BEGIN
  -- Get contact details
  SELECT * INTO v_contact FROM crm_contacts WHERE id = p_contact_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  v_company_id := v_contact.company_id;

  -- Iterate active scoring rules for this company
  FOR v_rule IN
    SELECT * FROM crm_scoring_rules
    WHERE company_id = v_company_id AND is_active = true
    ORDER BY sort_order
  LOOP
    v_points := 0;

    CASE v_rule.condition_type
      WHEN 'has_email' THEN
        IF v_contact.email IS NOT NULL AND v_contact.email != '' THEN
          v_points := v_rule.points;
        END IF;
      WHEN 'has_phone' THEN
        IF v_contact.phone IS NOT NULL AND v_contact.phone != '' THEN
          v_points := v_rule.points;
        END IF;
      WHEN 'has_budget' THEN
        IF v_contact.budget_max IS NOT NULL AND v_contact.budget_max > 0 THEN
          v_points := v_rule.points;
        END IF;
      WHEN 'source_match' THEN
        IF v_contact.source = (v_rule.condition_config->>'source')::TEXT THEN
          v_points := v_rule.points;
        END IF;
      WHEN 'contact_type_match' THEN
        IF v_contact.contact_type = (v_rule.condition_config->>'contact_type')::TEXT THEN
          v_points := v_rule.points;
        END IF;
      WHEN 'has_deal' THEN
        IF EXISTS (SELECT 1 FROM agent_deals WHERE contact_id = p_contact_id LIMIT 1) THEN
          v_points := v_rule.points;
        END IF;
      WHEN 'deal_value_above' THEN
        IF EXISTS (
          SELECT 1 FROM agent_deals
          WHERE contact_id = p_contact_id
            AND deal_value >= COALESCE((v_rule.condition_config->>'min_value')::NUMERIC, 0)
          LIMIT 1
        ) THEN
          v_points := v_rule.points;
        END IF;
      WHEN 'activity_count' THEN
        IF (
          SELECT COUNT(*) FROM crm_activities
          WHERE contact_id = p_contact_id
        ) >= COALESCE((v_rule.condition_config->>'min_count')::INTEGER, 1) THEN
          v_points := v_rule.points;
        END IF;
      WHEN 'lifecycle_stage' THEN
        IF v_contact.lifecycle_stage = (v_rule.condition_config->>'stage')::TEXT THEN
          v_points := v_rule.points;
        END IF;
      ELSE
        -- Unknown rule type, skip
        NULL;
    END CASE;

    IF v_points != 0 THEN
      v_total_score := v_total_score + v_points;
      -- Log to score log
      INSERT INTO crm_score_log (contact_id, rule_id, points, reason)
      VALUES (p_contact_id, v_rule.id, v_points, v_rule.rule_name);
    END IF;
  END LOOP;

  -- Update the contact's lead_score
  UPDATE crm_contacts SET lead_score = v_total_score WHERE id = p_contact_id;

  RETURN v_total_score;
END;
$$;

-- Trigger function: auto-score on contact insert/update
CREATE OR REPLACE FUNCTION public.trg_auto_score_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear old score log entries for this contact before recalculating
  DELETE FROM crm_score_log WHERE contact_id = NEW.id;
  -- Recalculate
  PERFORM recalculate_contact_score(NEW.id);
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_contact_auto_score ON crm_contacts;

-- Create trigger on insert and relevant field updates
CREATE TRIGGER trg_contact_auto_score
  AFTER INSERT OR UPDATE OF email, phone, source, contact_type, budget_max, lifecycle_stage
  ON crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION trg_auto_score_contact();

-- Trigger function: fire workflow on deal stage change
CREATE OR REPLACE FUNCTION public.trg_deal_stage_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trigger TEXT;
BEGIN
  -- Determine trigger type
  IF TG_OP = 'INSERT' THEN
    v_trigger := 'deal_created';
  ELSIF OLD.stage IS DISTINCT FROM NEW.stage THEN
    v_trigger := 'deal_stage_changed';
    IF NEW.stage = 'closed_won' THEN
      v_trigger := 'deal_won';
    ELSIF NEW.stage = 'closed_lost' THEN
      v_trigger := 'deal_lost';
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Call workflow execution edge function asynchronously via pg_net
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/execute-crm-workflow',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
    ),
    body := jsonb_build_object(
      'trigger_type', v_trigger,
      'company_id', NEW.company_id,
      'entity_id', NEW.id,
      'entity_type', 'deal',
      'metadata', jsonb_build_object(
        'stage_from', COALESCE(OLD.stage, ''),
        'stage_to', NEW.stage,
        'deal_type', NEW.deal_type
      )
    )
  );

  -- Also auto-score the linked contact if any
  IF NEW.contact_id IS NOT NULL THEN
    DELETE FROM crm_score_log WHERE contact_id = NEW.contact_id;
    PERFORM recalculate_contact_score(NEW.contact_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_deal_workflow ON agent_deals;

-- Create trigger
CREATE TRIGGER trg_deal_workflow
  AFTER INSERT OR UPDATE OF stage
  ON agent_deals
  FOR EACH ROW
  EXECUTE FUNCTION trg_deal_stage_workflow();
