-- Phase 2b (Part 5B): per-room-type live availability/inventory.
-- Complements 20260630120000_hotel_room_types.sql (room_types + room_type_rate_seasons).
-- A row per (room_type, date) tracks how many of that room's units are sellable,
-- an optional price override, and a hard block. check_room_type_availability()
-- answers "are >= N units of this room type free for [check_in, check_out)?" so
-- the booking flow can gate a room_rental order. Apply via Lovable Cloud, then
-- regenerate src/integrations/supabase/types.ts.

CREATE TABLE IF NOT EXISTS public.room_type_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  date DATE NOT NULL,
  units_available INT NOT NULL DEFAULT 0,   -- sellable units of this room type on this date
  price_override NUMERIC,                   -- optional nightly override (else season/base rate)
  is_blocked BOOLEAN NOT NULL DEFAULT false,-- hard stop for the date regardless of units
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (room_type_id, date)
);

ALTER TABLE public.room_type_availability ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_type_availability' AND policyname = 'Owners manage own room availability') THEN
    CREATE POLICY "Owners manage own room availability" ON public.room_type_availability
      FOR ALL
      USING (auth.uid() = owner_id OR public.is_admin_or_uno_team())
      WITH CHECK (auth.uid() = owner_id OR public.is_admin_or_uno_team());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_type_availability' AND policyname = 'Public read active room availability') THEN
    CREATE POLICY "Public read active room availability" ON public.room_type_availability
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.room_types rt
          JOIN public.properties p ON p.id = rt.property_id
          WHERE rt.id = room_type_id AND rt.is_active = true AND p.is_active = true
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_room_type_availability_room ON public.room_type_availability(room_type_id);
CREATE INDEX IF NOT EXISTS idx_room_type_availability_date ON public.room_type_availability(date);

-- Are at least p_units of this room type sellable for every night in
-- [p_check_in, p_check_out)? A date with no row falls back to the room's
-- total_units (i.e. open by default); a blocked date or an explicit shortfall
-- makes the whole range unavailable. Mirrors check_property_availability's
-- "open unless told otherwise" default so new rooms are immediately bookable.
CREATE OR REPLACE FUNCTION public.check_room_type_availability(
  p_room_type_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_units INT DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_units INT;
  v_night DATE;
  v_units INT;
  v_blocked BOOLEAN;
BEGIN
  -- Input validation for a public (anon-callable) SECURITY DEFINER function:
  -- NULLs make the range comparison evaluate to NULL (not false), which would
  -- otherwise fall through the loop and wrongly return "available".
  IF p_check_in IS NULL OR p_check_out IS NULL OR p_units IS NULL THEN
    RETURN false;
  END IF;
  IF p_check_out <= p_check_in THEN
    RETURN false;
  END IF;
  -- Bound the per-night loop against absurd ranges (~2 years max).
  IF p_check_out - p_check_in > 730 THEN
    RETURN false;
  END IF;

  SELECT total_units INTO v_total_units FROM public.room_types WHERE id = p_room_type_id;
  IF v_total_units IS NULL THEN
    RETURN false; -- unknown room type
  END IF;

  v_night := p_check_in;
  WHILE v_night < p_check_out LOOP
    SELECT units_available, is_blocked
      INTO v_units, v_blocked
      FROM public.room_type_availability
     WHERE room_type_id = p_room_type_id AND date = v_night;

    IF FOUND THEN
      IF v_blocked OR v_units < p_units THEN
        RETURN false;
      END IF;
    ELSE
      -- No override row for this night: open up to the room's total units.
      IF v_total_units < p_units THEN
        RETURN false;
      END IF;
    END IF;

    v_night := v_night + 1;
  END LOOP;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_room_type_availability(UUID, DATE, DATE, INT) TO anon, authenticated;
