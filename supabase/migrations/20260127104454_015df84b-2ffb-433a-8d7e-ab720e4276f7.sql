-- =============================================
-- P1-3: ADD SOFT DELETE COLUMNS TO ORDERS
-- =============================================

-- First, add the columns (if not already added from partial migration)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at 
ON public.orders(deleted_at) WHERE deleted_at IS NULL;