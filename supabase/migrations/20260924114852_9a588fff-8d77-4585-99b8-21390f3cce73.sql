ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_phone text;
CREATE INDEX IF NOT EXISTS idx_service_orders_provider_sched ON public.service_orders(provider_id, scheduled_at);

DROP POLICY IF EXISTS "Admins full access to orders" ON public.service_orders;
CREATE POLICY "Admins and staff full access to service orders" ON public.service_orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Provider owners view their service orders" ON public.service_orders
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = service_orders.provider_id AND p.user_id = auth.uid()));
CREATE POLICY "Provider owners update their service orders" ON public.service_orders
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = service_orders.provider_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = service_orders.provider_id AND p.user_id = auth.uid()));

CREATE TABLE public.provider_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time),
  UNIQUE (provider_id, weekday, start_time)
);
GRANT SELECT ON public.provider_availability TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_availability TO authenticated;
GRANT ALL ON public.provider_availability TO service_role;
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view provider hours" ON public.provider_availability FOR SELECT USING (true);
CREATE POLICY "Provider owners manage hours" ON public.provider_availability FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_availability.provider_id AND p.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_availability.provider_id AND p.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.touch_provider_availability() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_provider_availability_updated BEFORE UPDATE ON public.provider_availability
  FOR EACH ROW EXECUTE FUNCTION public.touch_provider_availability();

CREATE OR REPLACE FUNCTION public.get_provider_busy_slots(_provider_id uuid, _from timestamptz, _to timestamptz)
RETURNS TABLE(starts_at timestamptz, ends_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.scheduled_at, o.scheduled_at + make_interval(mins => COALESCE(o.duration_minutes, 60))
  FROM public.service_orders o
  WHERE o.provider_id = _provider_id AND o.scheduled_at IS NOT NULL
    AND o.scheduled_at < _to AND o.scheduled_at + make_interval(mins => COALESCE(o.duration_minutes, 60)) > _from
    AND COALESCE(o.status, 'pending') NOT IN ('cancelled', 'rejected')
$$;
GRANT EXECUTE ON FUNCTION public.get_provider_busy_slots(uuid, timestamptz, timestamptz) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.validate_service_order() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record;
BEGIN
  IF NEW.service_id IS NULL THEN RETURN NEW; END IF;
  SELECT id, provider_id, price, currency, duration_minutes, name_en, name_ru INTO s
    FROM public.services WHERE id = NEW.service_id AND is_active = true AND approval_status = 'approved';
  IF NOT FOUND THEN RAISE EXCEPTION 'SERVICE_UNAVAILABLE'; END IF;
  NEW.provider_id := s.provider_id;
  NEW.amount := s.price;
  NEW.currency := COALESCE(s.currency, 'THB');
  NEW.duration_minutes := COALESCE(s.duration_minutes, 60);
  NEW.service_name := s.name_en;
  NEW.service_name_ru := s.name_ru;
  NEW.service_type := COALESCE(NEW.service_type, 'marketplace');
  NEW.status := 'pending';
  NEW.payment_status := COALESCE(NEW.payment_status, 'unpaid');
  IF NEW.scheduled_at IS NULL OR NEW.scheduled_at <= now() THEN RAISE EXCEPTION 'SLOT_IN_PAST'; END IF;
  IF EXISTS (SELECT 1 FROM public.get_provider_busy_slots(s.provider_id, NEW.scheduled_at,
       NEW.scheduled_at + make_interval(mins => NEW.duration_minutes))) THEN
    RAISE EXCEPTION 'SLOT_TAKEN';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_validate_service_order BEFORE INSERT ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_service_order();