-- =====================================================
-- PHASE 1: Service Orders & Staff Assignment System
-- =====================================================

-- 1. Create service_orders table for guest orders during stay
CREATE TABLE public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE DEFAULT 'SO-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
  
  -- Связи
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  guest_id UUID NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  assigned_to UUID, -- Исполнитель (user_id)
  
  -- Детали заказа
  service_type TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_name_ru TEXT,
  description TEXT,
  
  -- Статус и время
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Финансы
  amount NUMERIC(10,2),
  currency TEXT DEFAULT 'THB',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  
  -- Выполнение
  notes TEXT,
  completion_notes TEXT,
  completion_photos TEXT[],
  
  -- Оценка
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add assignment fields to property_service_requests if not exists
ALTER TABLE public.property_service_requests 
ADD COLUMN IF NOT EXISTS assigned_to UUID,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completion_notes TEXT,
ADD COLUMN IF NOT EXISTS completion_photos TEXT[],
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS review TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- 3. Create staff_profiles table for service providers/executors
CREATE TABLE public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  phone TEXT,
  photo TEXT,
  bio TEXT,
  service_types TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{en}',
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  working_hours JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create service_order_status_history for tracking
CREATE TABLE public.service_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create indexes
CREATE INDEX idx_service_orders_guest ON public.service_orders(guest_id);
CREATE INDEX idx_service_orders_property ON public.service_orders(property_id);
CREATE INDEX idx_service_orders_assigned ON public.service_orders(assigned_to);
CREATE INDEX idx_service_orders_status ON public.service_orders(status);
CREATE INDEX idx_service_orders_scheduled ON public.service_orders(scheduled_at);
CREATE INDEX idx_property_service_requests_assigned ON public.property_service_requests(assigned_to);
CREATE INDEX idx_staff_profiles_user ON public.staff_profiles(user_id);
CREATE INDEX idx_staff_profiles_available ON public.staff_profiles(is_available, is_active);

-- 6. Enable RLS
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_status_history ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for service_orders
CREATE POLICY "Guests can view own orders" ON public.service_orders
  FOR SELECT USING (auth.uid() = guest_id);

CREATE POLICY "Guests can create orders" ON public.service_orders
  FOR INSERT WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Guests can update pending orders" ON public.service_orders
  FOR UPDATE USING (auth.uid() = guest_id AND status = 'pending');

CREATE POLICY "Staff can view assigned orders" ON public.service_orders
  FOR SELECT USING (auth.uid() = assigned_to);

CREATE POLICY "Staff can update assigned orders" ON public.service_orders
  FOR UPDATE USING (auth.uid() = assigned_to);

CREATE POLICY "Admins full access to orders" ON public.service_orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'vendor'))
  );

-- 8. RLS Policies for staff_profiles
CREATE POLICY "Anyone can view active staff" ON public.staff_profiles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can update own profile" ON public.staff_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins manage staff profiles" ON public.staff_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- 9. RLS for status history
CREATE POLICY "View order history" ON public.service_order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.service_orders so 
      WHERE so.id = order_id 
      AND (so.guest_id = auth.uid() OR so.assigned_to = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'vendor'))
  );

CREATE POLICY "Insert order history" ON public.service_order_status_history
  FOR INSERT WITH CHECK (true);

-- 10. Triggers for updated_at
CREATE TRIGGER update_service_orders_updated_at
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_profiles_updated_at
  BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Trigger to log status changes
CREATE OR REPLACE FUNCTION public.log_service_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.service_order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER service_order_status_change
  AFTER UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_service_order_status_change();

-- 12. Enable realtime for service_orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_orders;
ALTER TABLE public.service_orders REPLICA IDENTITY FULL;