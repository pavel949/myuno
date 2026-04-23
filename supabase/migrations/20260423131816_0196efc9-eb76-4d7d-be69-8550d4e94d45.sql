ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.booking_status_history REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_status_history;