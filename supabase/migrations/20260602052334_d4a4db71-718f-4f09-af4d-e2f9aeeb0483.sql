-- Fix ambiguous column reference + tautological comparison
CREATE OR REPLACE FUNCTION public.check_repeat_guest_and_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_guest_phone TEXT;
  v_guest_email TEXT;
  v_guest_name  TEXT;
  booking_count INT;
  task_exists   BOOLEAN;
  admin_id      UUID;
BEGIN
  IF NEW.status NOT IN ('confirmed', 'checked_in') THEN
    RETURN NEW;
  END IF;

  v_guest_phone := COALESCE(NEW.guest_phone, '');
  v_guest_email := COALESCE(NEW.guest_email, '');
  v_guest_name  := COALESCE(NEW.guest_name, 'Guest');

  IF v_guest_phone = '' AND v_guest_email = '' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO booking_count
  FROM property_bookings pb
  WHERE pb.id <> NEW.id
    AND pb.status IN ('confirmed', 'completed', 'checked_in')
    AND (
      (v_guest_phone <> '' AND pb.guest_phone = v_guest_phone)
      OR (v_guest_email <> '' AND pb.guest_email = v_guest_email)
    );

  IF booking_count < 1 THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO admin_id
  FROM user_roles
  WHERE role = 'admin'
  LIMIT 1;

  SELECT EXISTS(
    SELECT 1 FROM crm_tasks
    WHERE title LIKE '%' || v_guest_name || '%repeat%'
      AND created_at > NOW() - INTERVAL '30 days'
  ) INTO task_exists;

  IF NOT task_exists AND admin_id IS NOT NULL THEN
    INSERT INTO crm_tasks (
      title, description, status, priority, assigned_to, due_date, tags, company_id
    ) VALUES (
      '🔥 Repeat guest: ' || v_guest_name || ' (booking #' || (booking_count + 1)::TEXT || ')',
      'Guest ' || v_guest_name || ' (phone: ' || v_guest_phone || ', email: ' || v_guest_email || ') '
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
$function$;

-- Loop: pending → confirmed → completed
UPDATE public.property_bookings
SET status='confirmed', confirmed_at=now()
WHERE id='d9ce2494-3b18-410a-9f05-096b61b500c9';

UPDATE public.property_bookings
SET status='completed'
WHERE id='d9ce2494-3b18-410a-9f05-096b61b500c9';