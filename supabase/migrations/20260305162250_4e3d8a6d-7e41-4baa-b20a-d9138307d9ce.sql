
-- =============================================================
-- 1. DB function: count guest bookings and create CRM task
--    when guest reaches 2nd or 3rd booking (repeat visitor trigger)
-- =============================================================

CREATE OR REPLACE FUNCTION public.check_repeat_guest_and_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_phone TEXT;
  guest_email TEXT;
  guest_name TEXT;
  booking_count INT;
  task_exists BOOLEAN;
  admin_id UUID;
BEGIN
  -- Only trigger on status change to confirmed or checked_in
  IF NEW.status NOT IN ('confirmed', 'checked_in') THEN
    RETURN NEW;
  END IF;

  -- Get guest contact info
  guest_phone := COALESCE(NEW.guest_phone, '');
  guest_email := COALESCE(NEW.guest_email, '');
  guest_name := COALESCE(NEW.guest_name, 'Guest');

  -- Skip if no contact info
  IF guest_phone = '' AND guest_email = '' THEN
    RETURN NEW;
  END IF;

  -- Count previous confirmed/completed bookings by this guest
  SELECT COUNT(*) INTO booking_count
  FROM property_bookings
  WHERE id != NEW.id
    AND status IN ('confirmed', 'completed', 'checked_in')
    AND (
      (guest_phone != '' AND guest_phone = guest_phone)
      OR (guest_email != '' AND guest_email = guest_email)
    );

  -- Only trigger on 2nd or 3rd booking (booking_count = 1 means this is their 2nd)
  IF booking_count < 1 THEN
    RETURN NEW;
  END IF;

  -- Find admin user (first user with admin role) to assign task
  SELECT user_id INTO admin_id
  FROM user_roles
  WHERE role = 'admin'
  LIMIT 1;

  -- Check if we already created a repeat-guest task for this phone/email
  SELECT EXISTS(
    SELECT 1 FROM crm_tasks
    WHERE title LIKE '%' || guest_name || '%repeat%'
      AND created_at > NOW() - INTERVAL '30 days'
  ) INTO task_exists;

  IF NOT task_exists AND admin_id IS NOT NULL THEN
    INSERT INTO crm_tasks (
      title,
      description,
      status,
      priority,
      assigned_to,
      due_date,
      tags,
      company_id
    ) VALUES (
      '🔥 Repeat guest: ' || guest_name || ' (booking #' || (booking_count + 1)::TEXT || ')',
      'Guest ' || guest_name || ' (phone: ' || guest_phone || ', email: ' || guest_email || ') '
        || 'has made ' || (booking_count + 1)::TEXT || ' bookings. '
        || CASE WHEN booking_count >= 2 
            THEN 'HIGH SIGNAL: Ready to buy? Schedule a call about investment opportunities.'
            ELSE 'Consider reaching out about property purchase opportunities.'
           END,
      'todo',
      CASE WHEN booking_count >= 2 THEN 'urgent' ELSE 'high' END,
      admin_id,
      (NOW() + INTERVAL '2 days')::DATE,
      ARRAY['repeat-guest', 'hot-lead', 'capital-pipeline'],
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on property_bookings status changes
DROP TRIGGER IF EXISTS trg_check_repeat_guest ON property_bookings;
CREATE TRIGGER trg_check_repeat_guest
  AFTER INSERT OR UPDATE OF status ON property_bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_repeat_guest_and_notify();

-- =============================================================
-- 2. DB function + trigger: send welcome WhatsApp on check-in
-- =============================================================

CREATE OR REPLACE FUNCTION public.trigger_guest_welcome_whatsapp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when status changes TO checked_in
  IF NEW.status = 'checked_in' AND (OLD.status IS NULL OR OLD.status != 'checked_in') THEN
    -- Call the edge function via pg_net (fire & forget)
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-guest-welcome-whatsapp',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('booking_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DROP TRIGGER IF EXISTS trg_guest_welcome_whatsapp ON property_bookings;
CREATE TRIGGER trg_guest_welcome_whatsapp
  AFTER UPDATE OF status ON property_bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_guest_welcome_whatsapp();
