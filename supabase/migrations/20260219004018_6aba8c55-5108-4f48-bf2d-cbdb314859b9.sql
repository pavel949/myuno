
-- ══════════════════════════════════════════════════════════════════
-- FIX 1: Add in-app notification trigger for new consultation leads
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vertical text;
  v_type_label text;
  v_budget text;
BEGIN
  -- Build readable type label
  v_vertical := COALESCE(NEW.vertical_id, NEW.request_type, 'general');
  
  v_type_label := CASE NEW.request_type
    WHEN 'vacation_rental'        THEN '🏠 Аренда жилья'
    WHEN 'property_consultation'  THEN '🏠 Консультация по недвижимости'
    WHEN 'property_tour'          THEN '🏠 Просмотр объекта'
    WHEN 'investment_advice'      THEN '💰 Инвестиционная консультация'
    WHEN 'full_management'        THEN '🔑 Полное управление'
    WHEN 'channel_management'     THEN '📡 Управление каналами'
    WHEN 'long_term_rental'       THEN '📋 Долгосрочная аренда'
    WHEN 'property_purchase'      THEN '🏡 Покупка недвижимости'
    WHEN 'yacht_charter'          THEN '🛥️ Аренда яхты'
    WHEN 'car_rental'             THEN '🚗 Аренда авто'
    WHEN 'airport_transfer'       THEN '✈️ Трансфер'
    WHEN 'visa_consultation'      THEN '📄 Визовая консультация'
    WHEN 'doctor_appointment'     THEN '🏥 Запись к врачу'
    WHEN 'babysitter_hourly'      THEN '👶 Няня (почасово)'
    WHEN 'babysitter_daily'       THEN '👶 Няня (на день)'
    WHEN 'spa_booking'            THEN '💆 Спа'
    WHEN 'gym_daypass'            THEN '💪 Зал (день)'
    WHEN 'gym_membership'         THEN '💪 Абонемент в зал'
    WHEN 'table_booking'          THEN '🍽️ Бронь стола'
    ELSE COALESCE(NEW.request_type, 'general_inquiry')
  END;

  -- Build budget string
  IF NEW.budget_min IS NOT NULL OR NEW.budget_max IS NOT NULL THEN
    v_budget := ' · ' || COALESCE(NEW.currency, 'THB') || ' ' ||
                COALESCE(NEW.budget_min::text, '?') || '–' ||
                COALESCE(NEW.budget_max::text, '?');
  ELSE
    v_budget := '';
  END IF;

  -- Insert notification for all admins
  INSERT INTO public.notifications (user_id, title, body, type, data)
  SELECT
    ur.user_id,
    '📩 Новая заявка: ' || v_type_label,
    NEW.name || ' · ' || NEW.phone || v_budget,
    'lead',
    jsonb_build_object(
      'lead_id',      NEW.id,
      'request_type', NEW.request_type,
      'vertical_id',  v_vertical,
      'name',         NEW.name,
      'phone',        NEW.phone,
      'status',       NEW.status,
      'priority',     NEW.priority
    )
  FROM public.user_roles ur
  WHERE ur.role IN ('admin', 'uno_team');

  RETURN NEW;
END;
$$;

-- Create the trigger on consultation_requests
DROP TRIGGER IF EXISTS trg_notify_admins_new_lead ON public.consultation_requests;
CREATE TRIGGER trg_notify_admins_new_lead
  AFTER INSERT ON public.consultation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_new_lead();


-- ══════════════════════════════════════════════════════════════════
-- FIX 2: Remove duplicate property submission trigger
-- (keep the older canonical one, drop the duplicate)
-- ══════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trigger_notify_admins_property_submission ON public.owner_properties;


-- ══════════════════════════════════════════════════════════════════
-- FIX 3: Fix notify-admin-order email duplicate 'subject' key
-- (this is in edge function code, not DB — handled separately)
-- ══════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════
-- FIX 4: Add trigger for admin in-app notification on airport bookings
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_airport_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dir text;
BEGIN
  v_dir := CASE NEW.direction
    WHEN 'arrival'   THEN '✈️ Прилёт'
    WHEN 'departure' THEN '🛫 Вылет'
    ELSE NEW.direction
  END;

  INSERT INTO public.notifications (user_id, title, body, type, data)
  SELECT
    ur.user_id,
    '✈️ Fast Track: ' || v_dir,
    'Рейс ' || NEW.flight_number || ' · ' || NEW.flight_date || ' · ' || NEW.currency || ' ' || NEW.total_price::text,
    'airport_booking',
    jsonb_build_object(
      'booking_id',     NEW.id,
      'direction',      NEW.direction,
      'flight_number',  NEW.flight_number,
      'flight_date',    NEW.flight_date,
      'total_price',    NEW.total_price,
      'status',         NEW.status
    )
  FROM public.user_roles ur
  WHERE ur.role IN ('admin', 'uno_team');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_airport_booking ON public.airport_bookings;
CREATE TRIGGER trg_notify_admins_airport_booking
  AFTER INSERT ON public.airport_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_new_airport_booking();
