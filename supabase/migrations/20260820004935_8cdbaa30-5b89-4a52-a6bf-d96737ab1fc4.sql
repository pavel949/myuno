
-- =========================================================
-- Phase 1: listing-quality parity (media, amenities, reviews,
-- sleeping/stay rules) for the real-estate data model.
-- =========================================================

-- ---------- helpers ----------
CREATE OR REPLACE FUNCTION public.property_is_public(_property_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = _property_id
      AND p.is_active = true
      AND p.approval_status = 'approved'
      AND p.deleted_at IS NULL
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_property(_property_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'uno_team'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = _property_id
          AND (
            p.owner_id = auth.uid()
            OR p.provider_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.providers pr WHERE pr.id = p.provider_id AND pr.user_id = auth.uid())
            OR public.staff_can_access_property(auth.uid(), p.id)
            OR public.is_assigned_manager(auth.uid(), p.id)
          )
      )
$$;

-- ---------- 1. amenity catalogue ----------
CREATE TABLE public.amenity_catalog (
  code text PRIMARY KEY,
  category text NOT NULL,
  name_en text NOT NULL,
  name_ru text NOT NULL,
  name_th text,
  icon text,
  is_filterable boolean NOT NULL DEFAULT true,
  is_highlight boolean NOT NULL DEFAULT false,
  applies_to text[] NOT NULL DEFAULT ARRAY['rental','sale']::text[],
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.amenity_catalog TO anon, authenticated;
GRANT ALL ON public.amenity_catalog TO service_role;
ALTER TABLE public.amenity_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "amenity_catalog_public_read" ON public.amenity_catalog
  FOR SELECT USING (is_active = true);
CREATE POLICY "amenity_catalog_admin_manage" ON public.amenity_catalog
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_amenity_catalog_updated_at
  BEFORE UPDATE ON public.amenity_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 2. property <-> amenity link ----------
CREATE TABLE public.property_amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  amenity_code text NOT NULL REFERENCES public.amenity_catalog(code) ON DELETE CASCADE,
  note_en text,
  note_ru text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, amenity_code)
);

CREATE INDEX idx_property_amenities_property ON public.property_amenities(property_id);
CREATE INDEX idx_property_amenities_code ON public.property_amenities(amenity_code);

GRANT SELECT ON public.property_amenities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.property_amenities TO authenticated;
GRANT ALL ON public.property_amenities TO service_role;
ALTER TABLE public.property_amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_amenities_public_read" ON public.property_amenities
  FOR SELECT USING (public.property_is_public(property_id) OR public.can_manage_property(property_id));
CREATE POLICY "property_amenities_manage" ON public.property_amenities
  FOR ALL TO authenticated
  USING (public.can_manage_property(property_id))
  WITH CHECK (public.can_manage_property(property_id));

-- ---------- 3. structured media library ----------
CREATE TABLE public.property_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text,
  kind text NOT NULL DEFAULT 'photo',
  room_tag text,
  caption_en text,
  caption_ru text,
  caption_th text,
  alt_en text,
  alt_ru text,
  width_px integer,
  height_px integer,
  display_order integer NOT NULL DEFAULT 0,
  is_cover boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_property_media_property_order
  ON public.property_media(property_id, display_order);
CREATE UNIQUE INDEX idx_property_media_one_cover
  ON public.property_media(property_id) WHERE is_cover = true;

GRANT SELECT ON public.property_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.property_media TO authenticated;
GRANT ALL ON public.property_media TO service_role;
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_media_public_read" ON public.property_media
  FOR SELECT USING (
    (is_active = true AND public.property_is_public(property_id))
    OR public.can_manage_property(property_id)
  );
CREATE POLICY "property_media_manage" ON public.property_media
  FOR ALL TO authenticated
  USING (public.can_manage_property(property_id))
  WITH CHECK (public.can_manage_property(property_id));

CREATE TRIGGER trg_property_media_updated_at
  BEFORE UPDATE ON public.property_media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- media kind / room tag validation via trigger (keeps values open-ended but sane)
CREATE OR REPLACE FUNCTION public.validate_property_media()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.kind NOT IN ('photo','video','tour','floor_plan','document') THEN
    RAISE EXCEPTION 'Invalid media kind: %', NEW.kind;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_property_media_validate
  BEFORE INSERT OR UPDATE ON public.property_media
  FOR EACH ROW EXECUTE FUNCTION public.validate_property_media();

-- ---------- 4. review sub-ratings + verified stay ----------
ALTER TABLE public.property_reviews
  ADD COLUMN IF NOT EXISTS booking_id uuid,
  ADD COLUMN IF NOT EXISTS reviewer_id uuid,
  ADD COLUMN IF NOT EXISTS rating_cleanliness numeric(2,1),
  ADD COLUMN IF NOT EXISTS rating_accuracy numeric(2,1),
  ADD COLUMN IF NOT EXISTS rating_communication numeric(2,1),
  ADD COLUMN IF NOT EXISTS rating_location numeric(2,1),
  ADD COLUMN IF NOT EXISTS rating_checkin numeric(2,1),
  ADD COLUMN IF NOT EXISTS rating_value numeric(2,1),
  ADD COLUMN IF NOT EXISTS is_verified_stay boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stay_date date,
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT ARRAY[]::text[];

CREATE INDEX IF NOT EXISTS idx_property_reviews_property ON public.property_reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_reviewer ON public.property_reviews(reviewer_id);

CREATE OR REPLACE FUNCTION public.validate_property_review()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.rating IS NOT NULL AND (NEW.rating < 1 OR NEW.rating > 5) THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  IF COALESCE(NEW.rating_cleanliness, 5) NOT BETWEEN 1 AND 5
     OR COALESCE(NEW.rating_accuracy, 5) NOT BETWEEN 1 AND 5
     OR COALESCE(NEW.rating_communication, 5) NOT BETWEEN 1 AND 5
     OR COALESCE(NEW.rating_location, 5) NOT BETWEEN 1 AND 5
     OR COALESCE(NEW.rating_checkin, 5) NOT BETWEEN 1 AND 5
     OR COALESCE(NEW.rating_value, 5) NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'sub-ratings must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_property_reviews_validate
  BEFORE INSERT OR UPDATE ON public.property_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_property_review();

GRANT SELECT ON public.property_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.property_reviews TO authenticated;
GRANT ALL ON public.property_reviews TO service_role;

DROP POLICY IF EXISTS "property_reviews_public_read" ON public.property_reviews;
CREATE POLICY "property_reviews_public_read" ON public.property_reviews
  FOR SELECT USING (
    (is_public = true AND public.property_is_public(property_id))
    OR public.can_manage_property(property_id)
    OR reviewer_id = auth.uid()
  );

DROP POLICY IF EXISTS "property_reviews_guest_insert" ON public.property_reviews;
CREATE POLICY "property_reviews_guest_insert" ON public.property_reviews
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "property_reviews_guest_update" ON public.property_reviews;
CREATE POLICY "property_reviews_guest_update" ON public.property_reviews
  FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "property_reviews_host_manage" ON public.property_reviews;
CREATE POLICY "property_reviews_host_manage" ON public.property_reviews
  FOR ALL TO authenticated
  USING (public.can_manage_property(property_id))
  WITH CHECK (public.can_manage_property(property_id));

-- ---------- 5. stay rules on properties ----------
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS max_stay_nights integer,
  ADD COLUMN IF NOT EXISTS advance_notice_hours integer DEFAULT 24,
  ADD COLUMN IF NOT EXISTS preparation_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booking_window_months integer DEFAULT 12;

-- ---------- 6. seed amenity catalogue ----------
INSERT INTO public.amenity_catalog (code, category, name_en, name_ru, name_th, icon, is_highlight, sort_order) VALUES
  ('wifi','essentials','Wi-Fi','Wi-Fi','ไวไฟ','wifi',true,10),
  ('air_conditioning','essentials','Air conditioning','Кондиционер','เครื่องปรับอากาศ','wind',true,20),
  ('heating','essentials','Heating','Отопление',NULL,'thermometer',false,30),
  ('hot_water','essentials','Hot water','Горячая вода',NULL,'droplet',false,40),
  ('workspace','essentials','Dedicated workspace','Рабочее место',NULL,'laptop',true,50),
  ('tv','essentials','TV','Телевизор',NULL,'tv',false,60),
  ('washer','essentials','Washing machine','Стиральная машина',NULL,'washing-machine',false,70),
  ('dryer','essentials','Dryer','Сушильная машина',NULL,'wind',false,80),
  ('iron','essentials','Iron','Утюг',NULL,'shirt',false,90),
  ('hair_dryer','essentials','Hair dryer','Фен',NULL,'wind',false,100),
  ('kitchen','kitchen','Kitchen','Кухня',NULL,'utensils',true,110),
  ('refrigerator','kitchen','Refrigerator','Холодильник',NULL,'refrigerator',false,120),
  ('microwave','kitchen','Microwave','Микроволновка',NULL,'microwave',false,130),
  ('oven','kitchen','Oven','Духовка',NULL,'cooking-pot',false,140),
  ('stove','kitchen','Stove','Плита',NULL,'flame',false,150),
  ('dishwasher','kitchen','Dishwasher','Посудомоечная машина',NULL,'utensils',false,160),
  ('coffee_maker','kitchen','Coffee maker','Кофемашина',NULL,'coffee',false,170),
  ('kettle','kitchen','Kettle','Электрочайник',NULL,'coffee',false,180),
  ('dining_area','kitchen','Dining area','Обеденная зона',NULL,'utensils',false,190),
  ('private_pool','outdoor','Private pool','Личный бассейн','สระว่ายน้ำส่วนตัว','waves',true,200),
  ('shared_pool','outdoor','Shared pool','Общий бассейн',NULL,'waves',true,210),
  ('balcony','outdoor','Balcony','Балкон',NULL,'square',false,220),
  ('terrace','outdoor','Terrace','Терраса',NULL,'square',false,230),
  ('garden','outdoor','Garden','Сад',NULL,'trees',false,240),
  ('bbq','outdoor','BBQ area','Зона барбекю',NULL,'flame',false,250),
  ('outdoor_furniture','outdoor','Outdoor furniture','Садовая мебель',NULL,'armchair',false,260),
  ('sea_view','views','Sea view','Вид на море','วิวทะเล','eye',true,270),
  ('pool_view','views','Pool view','Вид на бассейн',NULL,'eye',false,280),
  ('garden_view','views','Garden view','Вид на сад',NULL,'eye',false,290),
  ('mountain_view','views','Mountain view','Вид на горы',NULL,'mountain',false,300),
  ('city_view','views','City view','Вид на город',NULL,'building-2',false,310),
  ('gym','building','Gym','Спортзал','ฟิตเนส','dumbbell',true,320),
  ('sauna','building','Sauna','Сауна',NULL,'flame',false,330),
  ('coworking','building','Co-working space','Коворкинг',NULL,'laptop',false,340),
  ('kids_club','building','Kids club','Детский клуб',NULL,'baby',false,350),
  ('playground','building','Playground','Детская площадка',NULL,'baby',false,360),
  ('restaurant_onsite','building','On-site restaurant','Ресторан на территории',NULL,'utensils',false,370),
  ('shuttle_service','building','Shuttle service','Шаттл',NULL,'bus',false,380),
  ('reception_24h','building','24h reception','Ресепшн 24/7',NULL,'concierge-bell',false,390),
  ('elevator','building','Elevator','Лифт',NULL,'move-vertical',false,400),
  ('free_parking','parking','Free parking','Бесплатная парковка',NULL,'car',true,410),
  ('paid_parking','parking','Paid parking','Платная парковка',NULL,'car',false,420),
  ('ev_charger','parking','EV charger','Зарядка для электромобиля',NULL,'plug-zap',false,430),
  ('motorbike_parking','parking','Motorbike parking','Парковка для байка',NULL,'bike',false,440),
  ('smoke_alarm','safety','Smoke alarm','Датчик дыма',NULL,'siren',false,450),
  ('fire_extinguisher','safety','Fire extinguisher','Огнетушитель',NULL,'flame-kindling',false,460),
  ('first_aid_kit','safety','First aid kit','Аптечка',NULL,'briefcase-medical',false,470),
  ('security_24h','safety','24h security','Охрана 24/7',NULL,'shield',true,480),
  ('cctv','safety','CCTV in common areas','Видеонаблюдение',NULL,'video',false,490),
  ('safe','safety','In-room safe','Сейф',NULL,'lock',false,500),
  ('self_check_in','access','Self check-in','Самостоятельное заселение',NULL,'key-round',true,510),
  ('smart_lock','access','Smart lock','Умный замок',NULL,'key-round',false,520),
  ('keypad','access','Keypad entry','Кодовый замок',NULL,'keyboard',false,530),
  ('crib','family','Crib','Детская кроватка',NULL,'baby',false,540),
  ('high_chair','family','High chair','Стульчик для кормления',NULL,'baby',false,550),
  ('baby_bath','family','Baby bath','Детская ванночка',NULL,'bath',false,560),
  ('step_free_access','accessibility','Step-free access','Доступ без ступеней',NULL,'accessibility',false,570),
  ('wide_doorway','accessibility','Wide doorway','Широкие двери',NULL,'accessibility',false,580),
  ('grab_rails','accessibility','Grab rails in bathroom','Поручни в ванной',NULL,'accessibility',false,590),
  ('pets_allowed','policies','Pets allowed','Можно с животными',NULL,'paw-print',true,600),
  ('long_stay_friendly','policies','Long-stay friendly','Подходит для долгой аренды',NULL,'calendar-days',false,610),
  ('housekeeping_included','services','Housekeeping included','Уборка включена',NULL,'sparkles',true,620),
  ('linen_change','services','Linen change','Смена белья',NULL,'bed-double',false,630),
  ('concierge','services','Concierge','Консьерж',NULL,'concierge-bell',false,640)
ON CONFLICT (code) DO NOTHING;

-- ---------- 7. backfill media from legacy arrays ----------
INSERT INTO public.property_media (property_id, url, kind, display_order, is_cover)
SELECT p.id, p.cover_image, 'photo', 0, true
FROM public.properties p
WHERE p.cover_image IS NOT NULL AND p.cover_image <> ''
ON CONFLICT DO NOTHING;

INSERT INTO public.property_media (property_id, url, kind, display_order, is_cover)
SELECT p.id, img.url, 'photo', img.ord, false
FROM public.properties p
CROSS JOIN LATERAL unnest(p.images) WITH ORDINALITY AS img(url, ord)
WHERE p.images IS NOT NULL
  AND img.url IS NOT NULL
  AND img.url <> ''
  AND img.url IS DISTINCT FROM p.cover_image
ON CONFLICT DO NOTHING;

-- ---------- 8. backfill amenities that match catalogue codes ----------
INSERT INTO public.property_amenities (property_id, amenity_code)
SELECT DISTINCT p.id, ac.code
FROM public.properties p
CROSS JOIN LATERAL unnest(coalesce(p.amenities, ARRAY[]::text[])) AS a(raw)
JOIN public.amenity_catalog ac
  ON ac.code = lower(regexp_replace(trim(a.raw), '[\s-]+', '_', 'g'))
ON CONFLICT (property_id, amenity_code) DO NOTHING;
