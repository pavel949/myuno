
-- =====================================================
-- P0 SECURITY FIX: Functions search_path & RLS policies
-- =====================================================

-- ===========================================
-- PART 1: Fix 6 functions without search_path
-- ===========================================

-- 1. ensure_single_default_payment_method
CREATE OR REPLACE FUNCTION public.ensure_single_default_payment_method()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.payment_methods 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. generate_booking_operational_tasks
CREATE OR REPLACE FUNCTION public.generate_booking_operational_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert check-in task
  INSERT INTO public.property_tasks (property_id, booking_id, title, task_type, priority, due_date, status)
  VALUES (
    NEW.property_id,
    NEW.id,
    'Check-in: ' || NEW.guest_name,
    'check_in',
    'high',
    NEW.check_in_date,
    'pending'
  );
  
  -- Insert check-out task
  INSERT INTO public.property_tasks (property_id, booking_id, title, task_type, priority, due_date, status)
  VALUES (
    NEW.property_id,
    NEW.id,
    'Check-out: ' || NEW.guest_name,
    'check_out',
    'high',
    NEW.check_out_date,
    'pending'
  );
  
  RETURN NEW;
END;
$$;

-- 3. notify_admins_new_property_submission
CREATE OR REPLACE FUNCTION public.notify_admins_new_property_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert notification for admins about new property submission
  INSERT INTO public.notifications (user_id, type, title, message, data, is_read)
  SELECT 
    ur.user_id,
    'property_submission',
    'New Property Submitted',
    'A new property "' || NEW.title_en || '" has been submitted for review.',
    jsonb_build_object('property_id', NEW.id, 'owner_id', NEW.owner_id),
    false
  FROM public.user_roles ur
  WHERE ur.role IN ('admin', 'uno_team');
  
  RETURN NEW;
END;
$$;

-- 4. notify_owner_property_approval
CREATE OR REPLACE FUNCTION public.notify_owner_property_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when approval_status changes
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    INSERT INTO public.notifications (user_id, type, title, message, data, is_read)
    VALUES (
      NEW.owner_id,
      'property_approval',
      CASE 
        WHEN NEW.approval_status = 'approved' THEN 'Property Approved'
        WHEN NEW.approval_status = 'rejected' THEN 'Property Rejected'
        ELSE 'Property Status Updated'
      END,
      CASE 
        WHEN NEW.approval_status = 'approved' THEN 'Your property "' || NEW.title_en || '" has been approved and is now live.'
        WHEN NEW.approval_status = 'rejected' THEN 'Your property "' || NEW.title_en || '" was not approved. Reason: ' || COALESCE(NEW.rejection_reason, 'Not specified')
        ELSE 'Your property status has been updated to: ' || NEW.approval_status
      END,
      jsonb_build_object('property_id', NEW.id, 'status', NEW.approval_status),
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. update_payment_stages_updated_at
CREATE OR REPLACE FUNCTION public.update_payment_stages_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 6. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ===========================================
-- PART 2: Create helper function for admin check
-- ===========================================

CREATE OR REPLACE FUNCTION public.is_admin_or_uno_team()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role IN ('admin', 'uno_team')
  );
$$;

-- ===========================================
-- PART 3: Fix 7 RLS policies with USING(true)
-- ===========================================

-- 1. order_payment_stages - restrict to owners and admins
DROP POLICY IF EXISTS "System can insert payment stages" ON public.order_payment_stages;
DROP POLICY IF EXISTS "System can update payment stages" ON public.order_payment_stages;

CREATE POLICY "Users can insert own payment stages" 
ON public.order_payment_stages 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND o.customer_user_id = auth.uid()
  )
  OR public.is_admin_or_uno_team()
);

CREATE POLICY "Users can update own payment stages" 
ON public.order_payment_stages 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND o.customer_user_id = auth.uid()
  )
  OR public.is_admin_or_uno_team()
);

-- 2. page_views - analytics, allow anonymous insert with session validation
DROP POLICY IF EXISTS "pageviews_insert" ON public.page_views;

CREATE POLICY "Track page views" 
ON public.page_views 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  session_id IS NOT NULL
);

-- 3. realtime_stats - restrict to authenticated
DROP POLICY IF EXISTS "realtime_update" ON public.realtime_stats;

CREATE POLICY "Authenticated update realtime stats" 
ON public.realtime_stats 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- 4. user_events - analytics with session validation
DROP POLICY IF EXISTS "events_insert" ON public.user_events;

CREATE POLICY "Track user events" 
ON public.user_events 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  session_id IS NOT NULL OR user_id = auth.uid()
);

-- 5 & 6. user_sessions - insert and update with session_token validation
DROP POLICY IF EXISTS "sessions_insert" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_update" ON public.user_sessions;

CREATE POLICY "Create user sessions" 
ON public.user_sessions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  session_token IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE POLICY "Update own sessions" 
ON public.user_sessions 
FOR UPDATE 
TO anon, authenticated
USING (
  user_id IS NULL OR user_id = auth.uid()
);
