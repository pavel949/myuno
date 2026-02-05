-- P1 FIX: Add missing indexes for scalability

-- Index for marketplace_products - high sequential scan ratio (77%)
CREATE INDEX IF NOT EXISTS idx_marketplace_products_active 
ON public.marketplace_products (is_active, vendor_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_products_category_slug 
ON public.marketplace_products (category_slug, is_active);

-- Index for lookup_values - frequently queried
CREATE INDEX IF NOT EXISTS idx_lookup_values_type 
ON public.lookup_values (lookup_type, is_active);

-- Index for property_analytics - frequent filtering (correct column: property_id)
CREATE INDEX IF NOT EXISTS idx_property_analytics_property_date 
ON public.property_analytics (property_id, date);

-- Composite index for orders - common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_customer_status 
ON public.orders (customer_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_vertical 
ON public.orders (vertical, status) WHERE deleted_at IS NULL;

-- Index for consultation_requests - admin panel queries
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status_created 
ON public.consultation_requests (status, created_at DESC);

-- Index for notifications - user queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON public.notifications (user_id, is_read, created_at DESC);