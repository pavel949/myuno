
-- 1. owner_notifications table
CREATE TABLE public.owner_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_owner_notifications_owner ON public.owner_notifications(owner_id, is_read, created_at DESC);
CREATE INDEX idx_owner_notifications_property ON public.owner_notifications(property_id);

ALTER TABLE public.owner_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own notifications"
  ON public.owner_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can update own notifications"
  ON public.owner_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_notifications;

-- 2. Add approval_threshold to property_management_terms
ALTER TABLE public.property_management_terms
  ADD COLUMN IF NOT EXISTS approval_threshold NUMERIC DEFAULT NULL;

-- 3. Add approval_status to property_financials
ALTER TABLE public.property_financials
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'auto_approved';

-- 4. Trigger: auto-create owner_notification on critical activity_log events
CREATE OR REPLACE FUNCTION public.notify_owner_on_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_title TEXT;
  v_critical_actions TEXT[] := ARRAY[
    'booking_created', 'expense_recorded', 'income_recorded',
    'service_request_created', 'inspection_completed'
  ];
BEGIN
  -- Only notify on critical actions
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

CREATE TRIGGER trg_notify_owner_on_activity
  AFTER INSERT ON public.property_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_owner_on_activity();

-- 5. Trigger: auto-set approval_status for large expenses
CREATE OR REPLACE FUNCTION public.check_expense_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threshold NUMERIC;
BEGIN
  IF NEW.transaction_type != 'expense' THEN
    NEW.approval_status := 'auto_approved';
    RETURN NEW;
  END IF;

  SELECT approval_threshold INTO v_threshold
  FROM property_management_terms
  WHERE property_id = NEW.property_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_threshold IS NOT NULL AND NEW.amount >= v_threshold THEN
    NEW.approval_status := 'pending';
  ELSE
    NEW.approval_status := 'auto_approved';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_expense_approval
  BEFORE INSERT ON public.property_financials
  FOR EACH ROW
  EXECUTE FUNCTION public.check_expense_approval();
