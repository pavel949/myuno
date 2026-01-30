-- =============================================
-- RELIABLE BOOKING SYSTEM MIGRATION
-- Adds extended statuses, cancellation policies, and booking reliability fields
-- =============================================

-- 1. Add extended booking status enum if not exists
DO $$ 
BEGIN
  -- Add new status values to property_bookings
  -- Current: pending, confirmed, completed, cancelled
  -- New: pending_deposit, deposit_paid, checked_in, checked_out, cancelled_by_guest, cancelled_by_host, no_show
  
  -- We'll use text field as it already is, just document the allowed values
  COMMENT ON COLUMN property_bookings.status IS 'Booking status: pending, pending_deposit, deposit_paid, confirmed, checked_in, checked_out, completed, cancelled, cancelled_by_guest, cancelled_by_host, no_show';
END $$;

-- 2. Add booking reliability fields to property_bookings
ALTER TABLE property_bookings 
ADD COLUMN IF NOT EXISTS deposit_amount numeric,
ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz,
ADD COLUMN IF NOT EXISTS deposit_payment_method text,
ADD COLUMN IF NOT EXISTS deposit_stripe_session_id text,
ADD COLUMN IF NOT EXISTS cancellation_policy text,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS refund_amount numeric,
ADD COLUMN IF NOT EXISTS refund_status text,
ADD COLUMN IF NOT EXISTS refund_processed_at timestamptz,
ADD COLUMN IF NOT EXISTS service_fee numeric,
ADD COLUMN IF NOT EXISTS cleaning_fee numeric,
ADD COLUMN IF NOT EXISTS platform_commission numeric,
ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
ADD COLUMN IF NOT EXISTS confirmed_by uuid REFERENCES auth.users(id);

-- 3. Add comment for cancellation policy values
COMMENT ON COLUMN property_bookings.cancellation_policy IS 'Cancellation policy: flexible, moderate, strict, super_strict, non_refundable';
COMMENT ON COLUMN property_bookings.refund_status IS 'Refund status: pending, processed, declined, partial';

-- 4. Create cancellation_policy_rules table for policy definitions
CREATE TABLE IF NOT EXISTS cancellation_policy_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_code text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ru text NOT NULL,
  description_en text,
  description_ru text,
  -- Before check-in cutoffs (in hours)
  full_refund_hours integer, -- Hours before check-in for full refund
  partial_refund_hours integer, -- Hours before check-in for partial refund
  partial_refund_percent integer, -- Percentage refunded in partial window
  no_refund_hours integer DEFAULT 0, -- Hours before check-in when no refund applies
  -- Deposit handling
  deposit_refundable boolean DEFAULT false,
  -- Discount for non-refundable
  non_refundable_discount integer DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. Insert standard Airbnb-style policies
INSERT INTO cancellation_policy_rules (policy_code, name_en, name_ru, description_en, description_ru, full_refund_hours, partial_refund_hours, partial_refund_percent, deposit_refundable, sort_order)
VALUES 
  ('flexible', 'Flexible', 'Гибкая', 
   'Full refund up to 24 hours before check-in. After that, the first night is non-refundable.',
   'Полный возврат до 24 часов перед заездом. После этого первая ночь не возвращается.',
   24, 0, 0, false, 1),
   
  ('moderate', 'Moderate', 'Умеренная',
   'Full refund up to 5 days before check-in. After that, 50% refund up to 24 hours before check-in.',
   'Полный возврат до 5 дней перед заездом. После этого 50% возврат до 24 часов перед заездом.',
   120, 24, 50, false, 2),
   
  ('strict', 'Strict', 'Строгая',
   '50% refund up to 7 days before check-in. No refund after that.',
   '50% возврат до 7 дней перед заездом. После этого возврат невозможен.',
   168, 0, 0, false, 3),
   
  ('super_strict', 'Super Strict', 'Очень строгая',
   '50% refund up to 30 days before check-in. No refund after that.',
   '50% возврат до 30 дней перед заездом. После этого возврат невозможен.',
   720, 0, 0, false, 4),
   
  ('non_refundable', 'Non-refundable', 'Невозвратная',
   'No refund under any circumstances. 10% discount on booking.',
   'Возврат невозможен ни при каких обстоятельствах. Скидка 10% на бронирование.',
   0, 0, 0, false, 5)
ON CONFLICT (policy_code) DO NOTHING;

-- 6. Enable RLS on new table
ALTER TABLE cancellation_policy_rules ENABLE ROW LEVEL SECURITY;

-- 7. Public read access for policies
CREATE POLICY "Anyone can view cancellation policies"
  ON cancellation_policy_rules FOR SELECT
  USING (true);

-- 8. Create booking_status_log for audit trail (if not exists)
CREATE TABLE IF NOT EXISTS property_booking_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES property_bookings(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  reason text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- 9. Enable RLS on status log
ALTER TABLE property_booking_status_log ENABLE ROW LEVEL SECURITY;

-- 10. Owners can view their booking status logs
CREATE POLICY "Owners can view their booking status logs"
  ON property_booking_status_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_bookings pb
      WHERE pb.id = booking_id AND pb.owner_id = auth.uid()
    )
  );

-- 11. Index for faster queries
CREATE INDEX IF NOT EXISTS idx_property_bookings_status ON property_bookings(status);
CREATE INDEX IF NOT EXISTS idx_property_bookings_deposit_paid_at ON property_bookings(deposit_paid_at);
CREATE INDEX IF NOT EXISTS idx_property_booking_status_log_booking ON property_booking_status_log(booking_id);