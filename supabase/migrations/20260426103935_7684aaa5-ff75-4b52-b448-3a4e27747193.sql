-- =============================================================================
-- Per-booking status history: triggers + history for property_bookings,
-- auto-history for `bookings`, and partner-visibility extension on
-- booking_status_history.
-- =============================================================================

-- ---------- 1. property_booking_status_history ----------
CREATE TABLE IF NOT EXISTS public.property_booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.property_bookings(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pbsh_booking_id_created_at
  ON public.property_booking_status_history (booking_id, created_at);

ALTER TABLE public.property_booking_status_history ENABLE ROW LEVEL SECURITY;

-- SELECT for property owner, the linked guest user, and active MC members
CREATE POLICY "View property booking history"
ON public.property_booking_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.property_bookings pb
    LEFT JOIN public.properties p ON p.id = pb.property_id
    LEFT JOIN public.management_company_members mcm
           ON mcm.company_id = p.management_company_id
          AND mcm.user_id = auth.uid()
          AND mcm.is_active = true
    WHERE pb.id = property_booking_status_history.booking_id
      AND (
        pb.owner_id = auth.uid()
        OR pb.guest_id = auth.uid()
        OR mcm.user_id IS NOT NULL
      )
  )
);

-- No client-side INSERT/UPDATE/DELETE: trigger writes via SECURITY DEFINER.

-- ---------- 2. Shared status-change recorder ----------
CREATE OR REPLACE FUNCTION public.record_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_table TEXT := TG_ARGV[0];   -- e.g. 'booking_status_history'
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    EXECUTE format(
      'INSERT INTO public.%I (booking_id, from_status, to_status, changed_by) VALUES ($1, $2, $3, $4)',
      target_table
    )
    USING NEW.id, OLD.status::text, NEW.status::text, auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- ---------- 3. Trigger on bookings (auto-history) ----------
DROP TRIGGER IF EXISTS trg_bookings_status_history ON public.bookings;
CREATE TRIGGER trg_bookings_status_history
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.record_booking_status_change('booking_status_history');

-- ---------- 4. Trigger on property_bookings ----------
DROP TRIGGER IF EXISTS trg_property_bookings_status_history ON public.property_bookings;
CREATE TRIGGER trg_property_bookings_status_history
AFTER UPDATE OF status ON public.property_bookings
FOR EACH ROW
EXECUTE FUNCTION public.record_booking_status_change('property_booking_status_history');

-- ---------- 5. Backfill: seed a 'created' row where history is empty ----------
INSERT INTO public.booking_status_history (booking_id, from_status, to_status, created_at)
SELECT b.id, NULL, b.status, b.created_at
FROM public.bookings b
WHERE NOT EXISTS (
  SELECT 1 FROM public.booking_status_history h WHERE h.booking_id = b.id
);

INSERT INTO public.property_booking_status_history (booking_id, from_status, to_status, created_at)
SELECT pb.id, NULL, COALESCE(pb.status, 'pending'), pb.created_at
FROM public.property_bookings pb
WHERE NOT EXISTS (
  SELECT 1 FROM public.property_booking_status_history h WHERE h.booking_id = pb.id
);

-- ---------- 6. Extend booking_status_history visibility to partners ----------
-- Vendor (provider owner) and assigned staff can read history of their bookings.
DROP POLICY IF EXISTS "Partners can view related booking history" ON public.booking_status_history;
CREATE POLICY "Partners can view related booking history"
ON public.booking_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    LEFT JOIN public.providers pr ON pr.id = b.provider_id
    WHERE b.id = booking_status_history.booking_id
      AND (
        pr.user_id = auth.uid()
        OR b.staff_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);

-- ---------- 7. Realtime publication ----------
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_booking_status_history;