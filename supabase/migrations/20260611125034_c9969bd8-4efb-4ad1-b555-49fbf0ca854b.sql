
-- 0. orders.order_type — добавить 'transfer'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_type_check
  CHECK (order_type = ANY (ARRAY[
    'service','tour','property','yacht','vehicle','event','activity','beauty',
    'cleaning','babysitter','education','medical','legal','pet_service',
    'flowers','food','mixed','transfer'
  ]));

-- 1. transport_vehicle_types — extend
ALTER TABLE public.transport_vehicle_types
  ADD COLUMN IF NOT EXISTS net_price NUMERIC,
  ADD COLUMN IF NOT EXISTS markup_pct NUMERIC NOT NULL DEFAULT 35,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. transport_destinations — extend
ALTER TABLE public.transport_destinations
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sedan_price INTEGER,
  ADD COLUMN IF NOT EXISTS van_price INTEGER,
  ADD COLUMN IF NOT EXISTS sedan_net INTEGER,
  ADD COLUMN IF NOT EXISTS van_net INTEGER;

-- 3. manual_payment_requests — extend
ALTER TABLE public.manual_payment_requests
  ADD COLUMN IF NOT EXISTS rub_sber_phone TEXT,
  ADD COLUMN IF NOT EXISTS myuno_advance_approved_by UUID,
  ADD COLUMN IF NOT EXISTS myuno_advance_limit_thb INTEGER;

-- 4. transfer_operators
CREATE TABLE IF NOT EXISTS public.transfer_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone_whatsapp TEXT NOT NULL,
  telegram_chat_id TEXT,
  email TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  languages TEXT[] NOT NULL DEFAULT ARRAY['en','th'],
  shift_start TIME,
  shift_end TIME,
  user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transfer_operators TO anon, authenticated;
GRANT ALL ON public.transfer_operators TO service_role;
ALTER TABLE public.transfer_operators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read active operators basic info" ON public.transfer_operators;
CREATE POLICY "Anyone can read active operators basic info"
  ON public.transfer_operators FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admins manage operators" ON public.transfer_operators;
CREATE POLICY "Admins manage operators"
  ON public.transfer_operators FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. transfer_meeting_points
CREATE TABLE IF NOT EXISTS public.transfer_meeting_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airport_code TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_th TEXT,
  description_en TEXT,
  description_ru TEXT,
  description_th TEXT,
  photo_url TEXT,
  google_maps_url TEXT,
  apple_maps_url TEXT,
  lat NUMERIC,
  lng NUMERIC,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transfer_meeting_points TO anon, authenticated;
GRANT ALL ON public.transfer_meeting_points TO service_role;
ALTER TABLE public.transfer_meeting_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read active meeting points" ON public.transfer_meeting_points;
CREATE POLICY "Anyone can read active meeting points"
  ON public.transfer_meeting_points FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admins manage meeting points" ON public.transfer_meeting_points;
CREATE POLICY "Admins manage meeting points"
  ON public.transfer_meeting_points FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. order_attachments
DO $$ BEGIN
  CREATE TYPE public.order_attachment_kind AS ENUM (
    'hotel_booking','address_photo','passport','flight_ticket','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.order_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  kind public.order_attachment_kind NOT NULL DEFAULT 'other',
  bucket TEXT NOT NULL DEFAULT 'transfer-attachments',
  file_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_attachments_order ON public.order_attachments(order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_attachments TO authenticated;
GRANT ALL ON public.order_attachments TO service_role;
ALTER TABLE public.order_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads own order attachments" ON public.order_attachments;
CREATE POLICY "Owner reads own order attachments"
  ON public.order_attachments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_attachments.order_id AND o.customer_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.transfer_operators op WHERE op.user_id = auth.uid() AND op.is_active)
  );

DROP POLICY IF EXISTS "Owner inserts own order attachments" ON public.order_attachments;
CREATE POLICY "Owner inserts own order attachments"
  ON public.order_attachments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_attachments.order_id AND o.customer_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins manage attachments" ON public.order_attachments;
CREATE POLICY "Admins manage attachments"
  ON public.order_attachments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. order_translations
CREATE TABLE IF NOT EXISTS public.order_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  lang TEXT NOT NULL CHECK (lang IN ('ru','en','th')),
  value TEXT NOT NULL,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(order_id, field, lang)
);
CREATE INDEX IF NOT EXISTS idx_order_translations_order ON public.order_translations(order_id);
GRANT SELECT ON public.order_translations TO authenticated;
GRANT ALL ON public.order_translations TO service_role;
ALTER TABLE public.order_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner/operator/admin read translations" ON public.order_translations;
CREATE POLICY "Owner/operator/admin read translations"
  ON public.order_translations FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_translations.order_id AND o.customer_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.transfer_operators op WHERE op.user_id = auth.uid() AND op.is_active)
  );

-- 8. transfer_night_surcharge_config
CREATE TABLE IF NOT EXISTS public.transfer_night_surcharge_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIME NOT NULL DEFAULT '22:00',
  end_time TIME NOT NULL DEFAULT '06:00',
  sedan_gross INTEGER NOT NULL DEFAULT 4050,
  van_gross INTEGER NOT NULL DEFAULT 6100,
  sedan_net INTEGER NOT NULL DEFAULT 3000,
  van_net INTEGER NOT NULL DEFAULT 4500,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transfer_night_surcharge_config TO anon, authenticated;
GRANT ALL ON public.transfer_night_surcharge_config TO service_role;
ALTER TABLE public.transfer_night_surcharge_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads night surcharge" ON public.transfer_night_surcharge_config;
CREATE POLICY "Anyone reads night surcharge"
  ON public.transfer_night_surcharge_config FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admins manage night surcharge" ON public.transfer_night_surcharge_config;
CREATE POLICY "Admins manage night surcharge"
  ON public.transfer_night_surcharge_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. updated_at triggers
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_transfer_operators_updated ON public.transfer_operators;
CREATE TRIGGER trg_transfer_operators_updated BEFORE UPDATE ON public.transfer_operators
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_transfer_meeting_points_updated ON public.transfer_meeting_points;
CREATE TRIGGER trg_transfer_meeting_points_updated BEFORE UPDATE ON public.transfer_meeting_points
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_transfer_night_surcharge_updated ON public.transfer_night_surcharge_config;
CREATE TRIGGER trg_transfer_night_surcharge_updated BEFORE UPDATE ON public.transfer_night_surcharge_config
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 10. RPC get_transfer_quote
CREATE OR REPLACE FUNCTION public.get_transfer_quote(
  p_vehicle_class TEXT,
  p_destination_id UUID,
  p_pickup_time TIMESTAMPTZ DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_base INTEGER;
  v_dest RECORD;
  v_night RECORD;
  v_surcharge INTEGER := 0;
  v_pickup_local_time TIME;
BEGIN
  SELECT * INTO v_dest FROM public.transport_destinations WHERE id = p_destination_id AND is_active;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error','destination_not_found');
  END IF;

  IF lower(p_vehicle_class) IN ('sedan','sedan_1_3') THEN
    v_base := COALESCE(v_dest.sedan_price, 0);
  ELSIF lower(p_vehicle_class) IN ('van','minivan','van_1_8') THEN
    v_base := COALESCE(v_dest.van_price, 0);
  ELSE
    RETURN jsonb_build_object('error','unknown_vehicle_class');
  END IF;

  IF p_pickup_time IS NOT NULL THEN
    SELECT * INTO v_night FROM public.transfer_night_surcharge_config WHERE is_active LIMIT 1;
    IF FOUND THEN
      v_pickup_local_time := (p_pickup_time AT TIME ZONE 'Asia/Bangkok')::time;
      IF (v_night.start_time > v_night.end_time
            AND (v_pickup_local_time >= v_night.start_time OR v_pickup_local_time < v_night.end_time))
         OR (v_night.start_time <= v_night.end_time
            AND v_pickup_local_time >= v_night.start_time AND v_pickup_local_time < v_night.end_time)
      THEN
        v_surcharge := CASE WHEN lower(p_vehicle_class) IN ('sedan','sedan_1_3')
                            THEN v_night.sedan_gross ELSE v_night.van_gross END;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'base_price', v_base,
    'night_surcharge', v_surcharge,
    'total', v_base + v_surcharge,
    'currency','THB',
    'destination', v_dest.name_en
  );
END $$;
GRANT EXECUTE ON FUNCTION public.get_transfer_quote(TEXT, UUID, TIMESTAMPTZ) TO anon, authenticated;

-- 11. RPC assign_transfer_operator
CREATE OR REPLACE FUNCTION public.assign_transfer_operator()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM public.transfer_operators
   WHERE is_active = TRUE
   ORDER BY is_primary DESC NULLS LAST, random()
   LIMIT 1;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.assign_transfer_operator() TO service_role;
