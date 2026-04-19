-- 1. EXCLUDE constraint: запрет пересечений активных броней на одном объекте
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.property_bookings
  ADD CONSTRAINT property_bookings_no_overlap
  EXCLUDE USING gist (
    property_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  )
  WHERE (status NOT IN ('cancelled', 'rejected', 'expired'));

-- 2. UNIQUE индекс для iCal: предотвращает повторный импорт того же события
CREATE UNIQUE INDEX IF NOT EXISTS property_bookings_ical_unique
  ON public.property_bookings (property_id, external_id)
  WHERE source = 'ical' AND external_id IS NOT NULL;

-- 3. CHECK: даты валидны
ALTER TABLE public.property_bookings
  ADD CONSTRAINT property_bookings_dates_valid
  CHECK (check_out > check_in);

-- 4. CHECK: сумма не отрицательная
ALTER TABLE public.property_bookings
  ADD CONSTRAINT property_bookings_amount_nonneg
  CHECK (total_amount IS NULL OR total_amount >= 0);

-- 5. property_financials: суммы не отрицательные
ALTER TABLE public.property_financials
  ADD CONSTRAINT property_financials_amount_nonneg
  CHECK (amount >= 0);