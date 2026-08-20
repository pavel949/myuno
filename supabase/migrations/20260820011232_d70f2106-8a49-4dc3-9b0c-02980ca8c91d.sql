-- Stay-rule columns must be readable by anonymous visitors, like the other
-- public listing columns (min_stay_nights, check_in_time, rooms ...).
GRANT SELECT (max_stay_nights) ON public.properties TO anon;
GRANT SELECT (advance_notice_hours) ON public.properties TO anon;
GRANT SELECT (preparation_days) ON public.properties TO anon;
GRANT SELECT (booking_window_months) ON public.properties TO anon;