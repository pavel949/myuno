-- Add 'abandoned' to order_status for cleanup-abandoned-orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'order_status' AND e.enumlabel = 'abandoned'
  ) THEN
    ALTER TYPE order_status ADD VALUE 'abandoned';
  END IF;
END $$;
