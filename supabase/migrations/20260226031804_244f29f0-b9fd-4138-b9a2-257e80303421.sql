
-- Add notification defaults to management terms (MC configures per property)
ALTER TABLE public.property_management_terms
  ADD COLUMN IF NOT EXISTS owner_notification_defaults JSONB DEFAULT '{
    "booking_created": true,
    "expense_recorded": true,
    "income_recorded": true,
    "service_request_created": true,
    "inspection_completed": true,
    "monthly_report": true
  }'::jsonb;

-- Update trigger to respect notification defaults
CREATE OR REPLACE FUNCTION public.notify_owner_on_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_title TEXT;
  v_defaults JSONB;
  v_critical_actions TEXT[] := ARRAY[
    'booking_created', 'expense_recorded', 'income_recorded',
    'service_request_created', 'inspection_completed'
  ];
BEGIN
  -- Only process critical actions
  IF NOT (NEW.action = ANY(v_critical_actions)) THEN
    RETURN NEW;
  END IF;

  -- Get property owner
  SELECT owner_id INTO v_owner_id
  FROM owner_properties
  WHERE id = NEW.property_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Don't notify owner about their own actions
  IF v_owner_id = NEW.actor_id THEN
    RETURN NEW;
  END IF;

  -- Check MC notification defaults
  SELECT owner_notification_defaults INTO v_defaults
  FROM property_management_terms
  WHERE property_id = NEW.property_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- If defaults exist and this action type is disabled, skip
  IF v_defaults IS NOT NULL AND (v_defaults->>NEW.action)::boolean IS FALSE THEN
    RETURN NEW;
  END IF;

  -- Build title
  v_title := CASE NEW.action
    WHEN 'booking_created' THEN 'Новое бронирование'
    WHEN 'expense_recorded' THEN 'Новый расход'
    WHEN 'income_recorded' THEN 'Доход записан'
    WHEN 'service_request_created' THEN 'Запрос на обслуживание'
    WHEN 'inspection_completed' THEN 'Осмотр завершён'
    ELSE NEW.action
  END;

  INSERT INTO owner_notifications (owner_id, property_id, type, title, body, metadata)
  VALUES (
    v_owner_id,
    NEW.property_id,
    NEW.action,
    v_title,
    COALESCE(NEW.details->>'description', NEW.details->>'guest_name', ''),
    NEW.details
  );

  RETURN NEW;
END;
$$;
