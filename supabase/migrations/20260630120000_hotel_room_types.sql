-- Phase 2 (Part 5B): Hotel room types + per-room-type seasonal rates.
-- A hotel is a `properties` row (asset_class='commercial'); room_types are its
-- bookable variants. Booking reuses the unified orders engine (order_items with
-- item_type='room_rental', resource_id=room_type_id). Pricing reuses the existing
-- calculatePricing()/buildPricingRulesFromSeasons() over room_type_rate_seasons.
-- Apply via Lovable Cloud, then regenerate src/integrations/supabase/types.ts.

-- 1. Room types — bookable room categories within a hotel property.
CREATE TABLE IF NOT EXISTS public.room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT,
  description_en TEXT,
  description_ru TEXT,
  max_occupancy INT NOT NULL DEFAULT 2,
  bed_config JSONB DEFAULT '[]'::jsonb,         -- [{ type: 'king'|'queen'|'twin'|..., count: N }]
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  base_price_per_night NUMERIC,
  currency TEXT DEFAULT 'THB',
  total_units INT NOT NULL DEFAULT 1,           -- how many identical rooms of this type exist
  refundable BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  is_bookable BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;

-- Owner (and admin/UNO team) manage their own property's room types.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_types' AND policyname = 'Owners manage own room types') THEN
    CREATE POLICY "Owners manage own room types" ON public.room_types
      FOR ALL
      USING (auth.uid() = owner_id OR public.is_admin_or_uno_team())
      WITH CHECK (auth.uid() = owner_id OR public.is_admin_or_uno_team());
  END IF;
END $$;

-- Public can read bookable room types of an active property (guest-facing).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_types' AND policyname = 'Public read active room types') THEN
    CREATE POLICY "Public read active room types" ON public.room_types
      FOR SELECT
      USING (
        is_active = true
        AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.is_active = true)
      );
  END IF;
END $$;

-- 2. Per-room-type seasonal rates — mirror of property_rate_seasons keyed by room_type_id,
--    so buildPricingRulesFromSeasons()/calculatePricing() are reused unchanged.
CREATE TABLE IF NOT EXISTS public.room_type_rate_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  nightly_rate NUMERIC NOT NULL DEFAULT 0,
  weekly_rate NUMERIC,
  monthly_rate NUMERIC,
  min_stay_nights INT DEFAULT 1,
  weekly_discount NUMERIC,
  monthly_discount NUMERIC,
  early_booking_discount NUMERIC,
  early_booking_days INT,
  last_minute_discount NUMERIC,
  last_minute_days INT,
  currency TEXT DEFAULT 'THB',
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.room_type_rate_seasons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_type_rate_seasons' AND policyname = 'Owners manage own room rate seasons') THEN
    CREATE POLICY "Owners manage own room rate seasons" ON public.room_type_rate_seasons
      FOR ALL
      USING (auth.uid() = owner_id OR public.is_admin_or_uno_team())
      WITH CHECK (auth.uid() = owner_id OR public.is_admin_or_uno_team());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_type_rate_seasons' AND policyname = 'Public read active room rate seasons') THEN
    CREATE POLICY "Public read active room rate seasons" ON public.room_type_rate_seasons
      FOR SELECT
      USING (
        is_active = true
        AND EXISTS (
          SELECT 1 FROM public.room_types rt
          JOIN public.properties p ON p.id = rt.property_id
          WHERE rt.id = room_type_id AND rt.is_active = true AND p.is_active = true
        )
      );
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_room_types_property ON public.room_types(property_id);
CREATE INDEX IF NOT EXISTS idx_room_types_owner ON public.room_types(owner_id);
CREATE INDEX IF NOT EXISTS idx_room_type_seasons_room ON public.room_type_rate_seasons(room_type_id);
CREATE INDEX IF NOT EXISTS idx_room_type_seasons_dates ON public.room_type_rate_seasons(start_date, end_date);
