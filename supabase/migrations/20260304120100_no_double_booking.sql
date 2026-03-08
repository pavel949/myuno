-- Prevent double booking: no overlapping (property_id, check_in, check_out) for active statuses.
-- Requires btree_gist for EXCLUDE with property_id + daterange.
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'property_bookings_no_overlap_active'
  ) THEN
    ALTER TABLE public.property_bookings
    ADD CONSTRAINT property_bookings_no_overlap_active
    EXCLUDE USING gist (
      property_id WITH =,
      daterange(
        (check_in::date),
        (check_out::date),
        '[]'
      ) WITH &&
    )
    WHERE (
      status IS NULL
      OR status NOT IN (
        'cancelled',
        'cancelled_by_guest',
        'cancelled_by_host',
        'abandoned',
        'no_show'
      )
    );
  END IF;
END $$;

COMMENT ON CONSTRAINT property_bookings_no_overlap_active ON public.property_bookings
  IS 'Prevents overlapping bookings for the same property when status is active';
