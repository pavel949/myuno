ALTER TABLE public.properties
  ADD CONSTRAINT properties_min_stay_nights_range CHECK (min_stay_nights IS NULL OR (min_stay_nights >= 1 AND min_stay_nights <= 3650)),
  ADD CONSTRAINT properties_max_stay_nights_range CHECK (max_stay_nights IS NULL OR (max_stay_nights >= 1 AND max_stay_nights <= 3650)),
  ADD CONSTRAINT properties_max_stay_gte_min_stay CHECK (max_stay_nights IS NULL OR min_stay_nights IS NULL OR max_stay_nights >= min_stay_nights),
  ADD CONSTRAINT properties_advance_notice_hours_range CHECK (advance_notice_hours IS NULL OR (advance_notice_hours >= 0 AND advance_notice_hours <= 8760)),
  ADD CONSTRAINT properties_preparation_days_range CHECK (preparation_days IS NULL OR (preparation_days >= 0 AND preparation_days <= 365)),
  ADD CONSTRAINT properties_booking_window_months_range CHECK (booking_window_months IS NULL OR (booking_window_months >= 1 AND booking_window_months <= 60));