
-- Add owner_readonly role support and auto-activity-log triggers

-- 1. Trigger function to auto-log activity from property_bookings
CREATE OR REPLACE FUNCTION public.log_booking_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.property_id,
      auth.uid(),
      'booking_created',
      'booking',
      NEW.id,
      jsonb_build_object(
        'guest_name', COALESCE(NEW.guest_name, ''),
        'check_in', NEW.check_in_date,
        'check_out', NEW.check_out_date,
        'total_price', NEW.total_price,
        'currency', COALESCE(NEW.currency, 'THB'),
        'status', COALESCE(NEW.status, 'confirmed')
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
      VALUES (
        NEW.property_id,
        auth.uid(),
        'booking_status_changed',
        'booking',
        NEW.id,
        jsonb_build_object(
          'guest_name', COALESCE(NEW.guest_name, ''),
          'old_status', OLD.status,
          'new_status', NEW.status,
          'total_price', NEW.total_price
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_booking_activity
  AFTER INSERT OR UPDATE ON public.property_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_booking_activity();

-- 2. Trigger function to auto-log activity from property_financials
CREATE OR REPLACE FUNCTION public.log_financial_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.property_id,
      auth.uid(),
      CASE WHEN NEW.type = 'income' THEN 'income_recorded' ELSE 'expense_recorded' END,
      'financial',
      NEW.id,
      jsonb_build_object(
        'type', NEW.type,
        'category', COALESCE(NEW.category, ''),
        'amount', NEW.amount,
        'currency', COALESCE(NEW.currency, 'THB'),
        'description', COALESCE(NEW.description, '')
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_financial_activity
  AFTER INSERT ON public.property_financials
  FOR EACH ROW
  EXECUTE FUNCTION public.log_financial_activity();

-- 3. Trigger function to auto-log activity from property_operational_tasks
CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.property_id,
      auth.uid(),
      'task_created',
      'task',
      NEW.id,
      jsonb_build_object(
        'title', COALESCE(NEW.title, ''),
        'task_type', COALESCE(NEW.task_type, ''),
        'priority', COALESCE(NEW.priority, 'medium'),
        'status', COALESCE(NEW.status, 'pending')
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
      VALUES (
        NEW.property_id,
        auth.uid(),
        'task_status_changed',
        'task',
        NEW.id,
        jsonb_build_object(
          'title', COALESCE(NEW.title, ''),
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_task_activity
  AFTER INSERT OR UPDATE ON public.property_operational_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_activity();

-- 4. Trigger for property_service_requests
CREATE OR REPLACE FUNCTION public.log_service_request_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.property_id,
      auth.uid(),
      'service_request_created',
      'service_request',
      NEW.id,
      jsonb_build_object(
        'request_type', COALESCE(NEW.request_type, ''),
        'description', COALESCE(NEW.description, ''),
        'status', COALESCE(NEW.status, 'pending')
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
      VALUES (
        NEW.property_id,
        auth.uid(),
        'service_request_updated',
        'service_request',
        NEW.id,
        jsonb_build_object(
          'request_type', COALESCE(NEW.request_type, ''),
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_service_request_activity
  AFTER INSERT OR UPDATE ON public.property_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_service_request_activity();

-- 5. Enable realtime on activity log for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_activity_log;
