
-- Fix log_booking_activity: wrong column names (check_in_date→check_in, check_out_date→check_out, total_price→total_amount)
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
      COALESCE(auth.uid(), NEW.owner_id),
      'booking_created',
      'booking',
      NEW.id,
      jsonb_build_object(
        'guest_name', COALESCE(NEW.guest_name, ''),
        'check_in', NEW.check_in,
        'check_out', NEW.check_out,
        'total_amount', NEW.total_amount,
        'currency', COALESCE(NEW.currency, 'THB'),
        'status', COALESCE(NEW.status, 'confirmed')
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
      VALUES (
        NEW.property_id,
        COALESCE(auth.uid(), NEW.owner_id),
        'booking_status_changed',
        'booking',
        NEW.id,
        jsonb_build_object(
          'guest_name', COALESCE(NEW.guest_name, ''),
          'old_status', OLD.status,
          'new_status', NEW.status,
          'total_amount', NEW.total_amount
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
