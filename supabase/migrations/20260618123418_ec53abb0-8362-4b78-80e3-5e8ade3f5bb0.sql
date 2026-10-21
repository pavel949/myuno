-- 1) Active properties sorted by rating (catalog default sort)
CREATE INDEX IF NOT EXISTS idx_properties_active_rating
  ON public.properties (rating DESC NULLS LAST)
  WHERE is_active = true;

-- 2) Active events sorted by date (main events feed)
CREATE INDEX IF NOT EXISTS idx_events_active_date
  ON public.events (event_date ASC)
  WHERE is_active = true;

-- 3) Active properties filtered by type + price (faceted search hot path)
CREATE INDEX IF NOT EXISTS idx_properties_active_type_price
  ON public.properties (property_type, price)
  WHERE is_active = true;