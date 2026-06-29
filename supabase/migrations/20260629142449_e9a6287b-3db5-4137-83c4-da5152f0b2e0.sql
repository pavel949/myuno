
-- Thai Business Layer: apply schema + GRANTs to prod (idempotent).
CREATE OR REPLACE FUNCTION public.thai_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

CREATE TABLE IF NOT EXISTS public.thai_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  name_th TEXT NOT NULL, name_en TEXT, name_ru TEXT,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('car_rental','bike_rental','car_service','car_wash','cafe','restaurant','flowers','delivery','other_services')),
  address TEXT,
  district TEXT CHECK (district IN ('Patong','Kata','Karon','Rawai','Chalong','Other')),
  lat NUMERIC, lng NUMERIC,
  working_hours JSONB DEFAULT '{}'::jsonb,
  phone TEXT, line_id TEXT,
  payment_methods TEXT[] DEFAULT '{}',
  ownership_type TEXT CHECK (ownership_type IN ('thai_owned','russian_owned','mixed')),
  description_th TEXT, description_ru TEXT,
  logo_url TEXT, gallery_urls TEXT[] DEFAULT '{}',
  rating_avg NUMERIC, rating_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  landing_title_ru TEXT, landing_subtitle_ru TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_thai_businesses_owner ON public.thai_businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_thai_businesses_slug ON public.thai_businesses(slug);
CREATE INDEX IF NOT EXISTS idx_thai_businesses_discovery ON public.thai_businesses(category, district, is_active);
DROP TRIGGER IF EXISTS trg_thai_businesses_updated_at ON public.thai_businesses;
CREATE TRIGGER trg_thai_businesses_updated_at BEFORE UPDATE ON public.thai_businesses FOR EACH ROW EXECUTE FUNCTION public.thai_touch_updated_at();

CREATE TABLE IF NOT EXISTS public.thai_business_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.thai_businesses(id) ON DELETE CASCADE,
  name_th TEXT NOT NULL, name_ru TEXT,
  description_th TEXT, description_ru TEXT,
  price_thb NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'one_time' CHECK (type IN ('one_time','by_time')),
  duration_minutes INTEGER,
  options JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_thai_services_business ON public.thai_business_services(business_id);
DROP TRIGGER IF EXISTS trg_thai_services_updated_at ON public.thai_business_services;
CREATE TRIGGER trg_thai_services_updated_at BEFORE UPDATE ON public.thai_business_services FOR EACH ROW EXECUTE FUNCTION public.thai_touch_updated_at();

CREATE TABLE IF NOT EXISTS public.thai_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.thai_businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.thai_business_services(id) ON DELETE SET NULL,
  date_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','confirmed','cancelled','completed')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','deposit_paid','fully_paid')),
  total_amount_thb NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_thai_bookings_business ON public.thai_bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_thai_bookings_customer ON public.thai_bookings(customer_id);
DROP TRIGGER IF EXISTS trg_thai_bookings_updated_at ON public.thai_bookings;
CREATE TRIGGER trg_thai_bookings_updated_at BEFORE UPDATE ON public.thai_bookings FOR EACH ROW EXECUTE FUNCTION public.thai_touch_updated_at();

CREATE TABLE IF NOT EXISTS public.thai_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.thai_businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, customer_id)
);
CREATE INDEX IF NOT EXISTS idx_thai_chats_business ON public.thai_chats(business_id);
CREATE INDEX IF NOT EXISTS idx_thai_chats_customer ON public.thai_chats(customer_id);

CREATE TABLE IF NOT EXISTS public.thai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.thai_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text_original TEXT NOT NULL DEFAULT '',
  lang_original TEXT NOT NULL DEFAULT 'ru' CHECK (lang_original IN ('ru','th','en')),
  text_translated TEXT NOT NULL DEFAULT '',
  lang_target TEXT NOT NULL DEFAULT 'th' CHECK (lang_target IN ('ru','th','en')),
  is_image BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_thai_chat_messages_chat ON public.thai_chat_messages(chat_id, created_at);

CREATE TABLE IF NOT EXISTS public.thai_business_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.thai_businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.thai_bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT, images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_thai_reviews_business ON public.thai_business_reviews(business_id);

-- GRANTs (Data API). anon gets SELECT only on tables with permissive read policies.
GRANT SELECT ON public.thai_businesses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.thai_businesses TO authenticated;
GRANT ALL ON public.thai_businesses TO service_role;

GRANT SELECT ON public.thai_business_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.thai_business_services TO authenticated;
GRANT ALL ON public.thai_business_services TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.thai_bookings TO authenticated;
GRANT ALL ON public.thai_bookings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.thai_chats TO authenticated;
GRANT ALL ON public.thai_chats TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.thai_chat_messages TO authenticated;
GRANT ALL ON public.thai_chat_messages TO service_role;

GRANT SELECT ON public.thai_business_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.thai_business_reviews TO authenticated;
GRANT ALL ON public.thai_business_reviews TO service_role;

ALTER TABLE public.thai_businesses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thai_business_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thai_bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thai_chats             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thai_chat_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thai_business_reviews  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS thai_businesses_select ON public.thai_businesses;
CREATE POLICY thai_businesses_select ON public.thai_businesses
  FOR SELECT USING (is_active = true OR owner_id = auth.uid() OR public.is_admin_or_uno_team());
DROP POLICY IF EXISTS thai_businesses_insert ON public.thai_businesses;
CREATE POLICY thai_businesses_insert ON public.thai_businesses
  FOR INSERT WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS thai_businesses_update ON public.thai_businesses;
CREATE POLICY thai_businesses_update ON public.thai_businesses
  FOR UPDATE USING (owner_id = auth.uid() OR public.is_admin_or_uno_team())
  WITH CHECK (owner_id = auth.uid() OR public.is_admin_or_uno_team());
DROP POLICY IF EXISTS thai_businesses_delete ON public.thai_businesses;
CREATE POLICY thai_businesses_delete ON public.thai_businesses
  FOR DELETE USING (owner_id = auth.uid() OR public.is_admin_or_uno_team());

DROP POLICY IF EXISTS thai_services_select ON public.thai_business_services;
CREATE POLICY thai_services_select ON public.thai_business_services
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.thai_businesses b WHERE b.id = business_id AND (b.is_active = true OR b.owner_id = auth.uid()))
    OR public.is_admin_or_uno_team()
  );
DROP POLICY IF EXISTS thai_services_write ON public.thai_business_services;
CREATE POLICY thai_services_write ON public.thai_business_services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.thai_businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
    OR public.is_admin_or_uno_team()
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.thai_businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
    OR public.is_admin_or_uno_team()
  );

DROP POLICY IF EXISTS thai_bookings_select ON public.thai_bookings;
CREATE POLICY thai_bookings_select ON public.thai_bookings
  FOR SELECT USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.thai_businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
    OR public.is_admin_or_uno_team()
  );
DROP POLICY IF EXISTS thai_bookings_insert ON public.thai_bookings;
CREATE POLICY thai_bookings_insert ON public.thai_bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS thai_bookings_update ON public.thai_bookings;
CREATE POLICY thai_bookings_update ON public.thai_bookings
  FOR UPDATE USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.thai_businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
    OR public.is_admin_or_uno_team()
  );

DROP POLICY IF EXISTS thai_chats_select ON public.thai_chats;
CREATE POLICY thai_chats_select ON public.thai_chats
  FOR SELECT USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.thai_businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
    OR public.is_admin_or_uno_team()
  );
DROP POLICY IF EXISTS thai_chats_insert ON public.thai_chats;
CREATE POLICY thai_chats_insert ON public.thai_chats
  FOR INSERT WITH CHECK (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.thai_businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );
DROP POLICY IF EXISTS thai_chats_update ON public.thai_chats;
CREATE POLICY thai_chats_update ON public.thai_chats
  FOR UPDATE USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.thai_businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
    OR public.is_admin_or_uno_team()
  );

DROP POLICY IF EXISTS thai_chat_messages_select ON public.thai_chat_messages;
CREATE POLICY thai_chat_messages_select ON public.thai_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.thai_chats c
      JOIN public.thai_businesses b ON b.id = c.business_id
      WHERE c.id = chat_id AND (c.customer_id = auth.uid() OR b.owner_id = auth.uid())
    ) OR public.is_admin_or_uno_team()
  );
DROP POLICY IF EXISTS thai_chat_messages_insert ON public.thai_chat_messages;
CREATE POLICY thai_chat_messages_insert ON public.thai_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.thai_chats c
      JOIN public.thai_businesses b ON b.id = c.business_id
      WHERE c.id = chat_id AND (c.customer_id = auth.uid() OR b.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS thai_reviews_select ON public.thai_business_reviews;
CREATE POLICY thai_reviews_select ON public.thai_business_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS thai_reviews_insert ON public.thai_business_reviews;
CREATE POLICY thai_reviews_insert ON public.thai_business_reviews FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Feature flag — keep enabled in prod (GA since 2026-06-24).
INSERT INTO public.system_settings (key, value)
VALUES ('feature_flag:thai_business_layer', '{"enabled": true}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
