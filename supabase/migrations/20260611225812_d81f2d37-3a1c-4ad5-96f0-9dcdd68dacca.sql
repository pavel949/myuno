
-- Wave 4 perf: targeted indexes for hot read paths + drop redundant indexes to speed up writes

-- 1. listings: featured prefetch (Home + InvestmentHub). Covers WHERE is_active AND is_featured AND vertical IN (...)
CREATE INDEX IF NOT EXISTS idx_listings_featured_active_vertical
  ON public.listings (vertical)
  WHERE is_active = true AND is_featured = true;

-- 2. marketplace_products: WHERE in_stock ORDER BY sort_order
CREATE INDEX IF NOT EXISTS idx_marketplace_products_instock_sort
  ON public.marketplace_products (sort_order)
  WHERE in_stock = true;

-- 3. properties: featured prefetch on Home
CREATE INDEX IF NOT EXISTS idx_properties_featured_active
  ON public.properties (created_at DESC)
  WHERE is_active = true AND is_featured = true;

-- 4. water_activities: WHERE is_active ORDER BY rating DESC
CREATE INDEX IF NOT EXISTS idx_water_activities_active_rating
  ON public.water_activities (rating DESC)
  WHERE is_active = true;

-- 5. Drop redundant single-column indexes already covered by composite ones.
-- Each redundant index slows down every INSERT (calendar_sync_logs is #2 hottest write).
DROP INDEX IF EXISTS public.idx_calendar_sync_logs_calendar_id;  -- covered by (calendar_id, synced_at DESC)
DROP INDEX IF EXISTS public.idx_calendar_sync_logs_owner_id;     -- covered by (owner_id, synced_at DESC)
