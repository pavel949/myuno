ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS property_kind text NOT NULL DEFAULT 'unit',
  ADD COLUMN IF NOT EXISTS parent_property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS room_category_id uuid;
ALTER TABLE public.properties ADD CONSTRAINT properties_property_kind_chk CHECK (property_kind IN ('unit','resort','hotel'));
CREATE INDEX IF NOT EXISTS idx_properties_parent ON public.properties(parent_property_id);

CREATE TABLE public.property_room_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_ru text,
  description_en text,
  description_ru text,
  max_guests integer NOT NULL DEFAULT 2 CHECK (max_guests > 0),
  bedrooms integer,
  bed_config text,
  area_sqm numeric,
  amenities text[] NOT NULL DEFAULT '{}',
  images text[] NOT NULL DEFAULT '{}',
  base_price_per_night numeric NOT NULL CHECK (base_price_per_night > 0),
  min_stay_nights integer NOT NULL DEFAULT 1 CHECK (min_stay_nights >= 1),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_room_categories_property ON public.property_room_categories(property_id);
ALTER TABLE public.properties ADD CONSTRAINT properties_room_category_fk FOREIGN KEY (room_category_id) REFERENCES public.property_room_categories(id) ON DELETE SET NULL;

CREATE TABLE public.property_rate_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.property_room_categories(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_ru text,
  adjustment_type text NOT NULL DEFAULT 'percent' CHECK (adjustment_type IN ('percent','fixed_per_night')),
  adjustment_value numeric NOT NULL DEFAULT 0,
  meal_plan text NOT NULL DEFAULT 'room_only' CHECK (meal_plan IN ('room_only','breakfast','half_board','full_board','all_inclusive')),
  is_refundable boolean NOT NULL DEFAULT true,
  free_cancellation_days integer CHECK (free_cancellation_days >= 0),
  min_stay_nights integer CHECK (min_stay_nights >= 1),
  max_stay_nights integer CHECK (max_stay_nights >= 1),
  min_advance_days integer CHECK (min_advance_days >= 0),
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (adjustment_type <> 'percent' OR (adjustment_value > -100 AND adjustment_value <= 500))
);
CREATE INDEX idx_rate_plans_category ON public.property_rate_plans(category_id);

CREATE TABLE public.property_stay_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.property_room_categories(id) ON DELETE CASCADE,
  date date NOT NULL,
  price_override numeric CHECK (price_override > 0),
  min_stay_nights integer CHECK (min_stay_nights >= 1),
  closed_to_arrival boolean NOT NULL DEFAULT false,
  closed_to_departure boolean NOT NULL DEFAULT false,
  stop_sell boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_stay_restrictions ON public.property_stay_restrictions(property_id, COALESCE(category_id,'00000000-0000-0000-0000-000000000000'::uuid), date);

ALTER TABLE public.property_rate_seasons ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.property_room_categories(id) ON DELETE CASCADE;

GRANT SELECT ON public.property_room_categories, public.property_rate_plans, public.property_stay_restrictions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_room_categories, public.property_rate_plans, public.property_stay_restrictions TO authenticated;
GRANT ALL ON public.property_room_categories, public.property_rate_plans, public.property_stay_restrictions TO service_role;

ALTER TABLE public.property_room_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_rate_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_stay_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active categories" ON public.property_room_categories FOR SELECT TO anon, authenticated
  USING (is_active AND public.is_property_bookable_active(property_id));
CREATE POLICY "Managers read categories" ON public.property_room_categories FOR SELECT TO authenticated USING (public.can_manage_property(property_id));
CREATE POLICY "Managers write categories" ON public.property_room_categories FOR ALL TO authenticated
  USING (public.can_manage_property(property_id)) WITH CHECK (public.can_manage_property(property_id));

CREATE POLICY "Public read active rate plans" ON public.property_rate_plans FOR SELECT TO anon, authenticated
  USING (is_active AND EXISTS (SELECT 1 FROM public.property_room_categories c WHERE c.id = category_id AND c.is_active AND public.is_property_bookable_active(c.property_id)));
CREATE POLICY "Managers manage rate plans" ON public.property_rate_plans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.property_room_categories c WHERE c.id = category_id AND public.can_manage_property(c.property_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.property_room_categories c WHERE c.id = category_id AND public.can_manage_property(c.property_id)));

CREATE POLICY "Public read restrictions" ON public.property_stay_restrictions FOR SELECT TO anon, authenticated
  USING (public.is_property_bookable_active(property_id));
CREATE POLICY "Managers manage restrictions" ON public.property_stay_restrictions FOR ALL TO authenticated
  USING (public.can_manage_property(property_id)) WITH CHECK (public.can_manage_property(property_id));

-- Category availability: rooms in category minus rooms with overlapping active bookings or blocks.
CREATE OR REPLACE FUNCTION public.get_category_availability(_category_id uuid, _check_in date, _check_out date)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.properties r
  WHERE r.room_category_id = _category_id AND r.is_active
    AND NOT EXISTS (SELECT 1 FROM public.property_bookings b WHERE b.property_id = r.id
      AND b.status NOT IN ('cancelled','rejected','no_show') AND b.check_in < _check_out AND b.check_out > _check_in)
    AND NOT EXISTS (SELECT 1 FROM public.property_availability a WHERE a.property_id = r.id
      AND a.date >= _check_in AND a.date < _check_out AND a.status IN ('blocked','booked'))
$$;
GRANT EXECUTE ON FUNCTION public.get_category_availability(uuid, date, date) TO anon, authenticated, service_role;

-- Room assignment: service_role only (called by checkout server).
CREATE OR REPLACE FUNCTION public.assign_room_for_category(_category_id uuid, _check_in date, _check_out date)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _room uuid;
BEGIN
  IF _check_out <= _check_in THEN RAISE EXCEPTION 'invalid dates'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(_category_id::text));
  SELECT r.id INTO _room FROM public.properties r
  WHERE r.room_category_id = _category_id AND r.is_active
    AND NOT EXISTS (SELECT 1 FROM public.property_bookings b WHERE b.property_id = r.id
      AND b.status NOT IN ('cancelled','rejected','no_show') AND b.check_in < _check_out AND b.check_out > _check_in)
    AND NOT EXISTS (SELECT 1 FROM public.property_availability a WHERE a.property_id = r.id
      AND a.date >= _check_in AND a.date < _check_out AND a.status IN ('blocked','booked'))
  ORDER BY r.unit_number NULLS LAST, r.id LIMIT 1;
  RETURN _room;
END $$;
REVOKE ALL ON FUNCTION public.assign_room_for_category(uuid, date, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_room_for_category(uuid, date, date) TO service_role;

INSERT INTO public.system_settings (key, value) VALUES ('feature_flag:multi_unit_properties', '{"enabled": true}'::jsonb) ON CONFLICT (key) DO NOTHING;