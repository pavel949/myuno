-- Batch 2
-- Migration: 20260113003246_78c6a1db-891a-4373-b13e-4d5320e7df8d.sql
-- Fix property_chat_messages policies using correct columns (property_id, booking_id)
DROP POLICY IF EXISTS "Anyone can view property chat messages" ON public.property_chat_messages;
DROP POLICY IF EXISTS "Property chat messages are publicly readable" ON public.property_chat_messages;
DROP POLICY IF EXISTS "Users can view own property chat messages" ON public.property_chat_messages;
DROP POLICY IF EXISTS "Users can send messages in own chats" ON public.property_chat_messages;
DROP POLICY IF EXISTS "Users can view their property chat messages" ON public.property_chat_messages;
DROP POLICY IF EXISTS "Owners can view their property messages" ON public.property_chat_messages;
DROP POLICY IF EXISTS "Owners can send their property messages" ON public.property_chat_messages;

-- Owner can view messages for their properties
CREATE POLICY "Owners can view property messages"
ON public.property_chat_messages FOR SELECT
TO authenticated
USING (
  sender_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = property_chat_messages.property_id
    AND op.owner_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    WHERE pb.id = property_chat_messages.booking_id
    AND pb.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can send property messages"
ON public.property_chat_messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Fix vendor policies
DROP POLICY IF EXISTS "Anyone can view vendor bookings" ON public.vendor_bookings;
DROP POLICY IF EXISTS "Vendors can view own bookings" ON public.vendor_bookings;
DROP POLICY IF EXISTS "Providers can view their vendor bookings" ON public.vendor_bookings;

CREATE POLICY "Vendors can view own bookings"
ON public.vendor_bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.id = vendor_bookings.provider_id
    AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Anyone can view vendor payouts" ON public.vendor_payouts;
DROP POLICY IF EXISTS "Vendors can view own payouts" ON public.vendor_payouts;
DROP POLICY IF EXISTS "Providers can view their vendor payouts" ON public.vendor_payouts;

CREATE POLICY "Vendors can view own payouts"
ON public.vendor_payouts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.id = vendor_payouts.provider_id
    AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Anyone can view vendor analytics" ON public.vendor_analytics;
DROP POLICY IF EXISTS "Vendors can view own analytics" ON public.vendor_analytics;
DROP POLICY IF EXISTS "Providers can view their vendor analytics" ON public.vendor_analytics;

CREATE POLICY "Vendors can view own analytics"
ON public.vendor_analytics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.id = vendor_analytics.provider_id
    AND p.user_id = auth.uid()
  )
);

-- Fix partner applications policies
DROP POLICY IF EXISTS "Anyone can view partner applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Users can view own applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Users can create own applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Users can update own pending applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Users can view their partner applications" ON public.partner_applications;

CREATE POLICY "Users can view own applications"
ON public.partner_applications FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own applications"
ON public.partner_applications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending applications"
ON public.partner_applications FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending');
-- Migration: 20260113004956_9d42691a-cbf1-4820-9ce7-d577ca37a644.sql
-- Add missing fields to vehicles table for complete vehicle management
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS transmission text DEFAULT 'automatic',
ADD COLUMN IF NOT EXISTS fuel_type text DEFAULT 'petrol',
ADD COLUMN IF NOT EXISTS year_built integer,
ADD COLUMN IF NOT EXISTS location_name text,
ADD COLUMN IF NOT EXISTS location_ru text,
ADD COLUMN IF NOT EXISTS doors integer DEFAULT 4,
ADD COLUMN IF NOT EXISTS engine_size text,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS license_plate text,
ADD COLUMN IF NOT EXISTS deposit_amount numeric,
ADD COLUMN IF NOT EXISTS min_rental_days integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS free_km_per_day integer,
ADD COLUMN IF NOT EXISTS extra_km_price numeric;

-- Add comments for documentation
COMMENT ON COLUMN public.vehicles.transmission IS 'automatic, manual';
COMMENT ON COLUMN public.vehicles.fuel_type IS 'petrol, diesel, electric, hybrid';
COMMENT ON COLUMN public.vehicles.year_built IS 'Vehicle manufacturing year';
COMMENT ON COLUMN public.vehicles.location_name IS 'Pickup location in English';
COMMENT ON COLUMN public.vehicles.location_ru IS 'Pickup location in Russian';
-- Migration: 20260113012936_49feb51c-2eb3-4444-baf3-b8b5f75a1e1e.sql
-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_ru TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vendor subscriptions table
CREATE TABLE public.vendor_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'incomplete')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id)
);

-- Platform fees configuration
CREATE TABLE public.platform_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES public.subscription_plans(id),
  fee_type TEXT NOT NULL CHECK (fee_type IN ('percentage', 'fixed')),
  fee_value NUMERIC NOT NULL DEFAULT 0,
  min_fee NUMERIC,
  max_fee NUMERIC,
  applies_to TEXT[] DEFAULT ARRAY['booking']::text[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Featured listings table
CREATE TABLE public.featured_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('day', 'week', 'month')),
  price_paid NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_payment_id TEXT,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
ON public.subscription_plans FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for vendor_subscriptions
CREATE POLICY "Vendors can view their own subscription"
ON public.vendor_subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.providers 
    WHERE id = provider_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all subscriptions"
ON public.vendor_subscriptions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for platform_fees (public read for active)
CREATE POLICY "Anyone can view active platform fees"
ON public.platform_fees FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage platform fees"
ON public.platform_fees FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for featured_listings
CREATE POLICY "Vendors can view their own featured listings"
ON public.featured_listings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.providers 
    WHERE id = provider_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can create featured listings for their entities"
ON public.featured_listings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.providers 
    WHERE id = provider_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all featured listings"
ON public.featured_listings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, name_ru, slug, description, description_ru, price_monthly, price_yearly, features, limits, sort_order, is_popular) VALUES
('Free', 'Бесплатный', 'free', 'Get started with basic features', 'Начните с базовых функций', 0, 0, 
  '["Up to 3 listings", "Basic analytics", "Email support"]'::jsonb,
  '{"max_listings": 3, "commission_percent": 15, "featured_allowed": false}'::jsonb,
  1, false),
('Pro', 'Про', 'pro', 'Everything you need to grow', 'Всё для роста вашего бизнеса', 49, 470,
  '["Up to 20 listings", "Advanced analytics", "Priority support", "Lower commission", "Featured listings"]'::jsonb,
  '{"max_listings": 20, "commission_percent": 10, "featured_allowed": true}'::jsonb,
  2, true),
('Business', 'Бизнес', 'business', 'For established businesses', 'Для крупного бизнеса', 149, 1430,
  '["Unlimited listings", "Full analytics suite", "Dedicated support", "Lowest commission", "Unlimited featured", "API access", "White-label options"]'::jsonb,
  '{"max_listings": -1, "commission_percent": 5, "featured_allowed": true, "api_access": true}'::jsonb,
  3, false);

-- Insert platform fees for each plan
INSERT INTO public.platform_fees (plan_id, fee_type, fee_value, applies_to)
SELECT id, 'percentage', (limits->>'commission_percent')::numeric, ARRAY['booking']
FROM public.subscription_plans;

-- Triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_subscriptions_updated_at
BEFORE UPDATE ON public.vendor_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260113013427_f7ed3a9f-86f0-453d-909d-7d7344c4dcfb.sql
-- Platform metrics snapshots table for daily analytics
CREATE TABLE public.platform_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  
  -- User metrics
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  
  -- Provider metrics
  total_providers INTEGER DEFAULT 0,
  active_providers INTEGER DEFAULT 0,
  new_providers INTEGER DEFAULT 0,
  
  -- Booking metrics
  total_bookings INTEGER DEFAULT 0,
  new_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  
  -- Revenue metrics
  gmv NUMERIC(12,2) DEFAULT 0,
  platform_revenue NUMERIC(12,2) DEFAULT 0,
  subscription_revenue NUMERIC(12,2) DEFAULT 0,
  
  -- Engagement metrics
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_metrics ENABLE ROW LEVEL SECURITY;

-- Only admins can view platform metrics
CREATE POLICY "Admins can view platform metrics"
  ON public.platform_metrics
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only system can insert/update (via service role)
CREATE POLICY "System can manage platform metrics"
  ON public.platform_metrics
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Index for date queries
CREATE INDEX idx_platform_metrics_date ON public.platform_metrics(date DESC);

-- Admin activity logs for audit trail
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for efficient queries
CREATE INDEX idx_admin_audit_logs_admin ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_created ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_action ON public.admin_audit_logs(action);

-- Function to calculate and store daily metrics
CREATE OR REPLACE FUNCTION public.calculate_daily_metrics(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users INTEGER;
  v_new_users INTEGER;
  v_active_users INTEGER;
  v_total_providers INTEGER;
  v_active_providers INTEGER;
  v_new_providers INTEGER;
  v_total_bookings INTEGER;
  v_new_bookings INTEGER;
  v_completed_bookings INTEGER;
  v_cancelled_bookings INTEGER;
  v_gmv NUMERIC(12,2);
  v_platform_revenue NUMERIC(12,2);
  v_subscription_revenue NUMERIC(12,2);
BEGIN
  -- User metrics
  SELECT COUNT(*) INTO v_total_users FROM profiles WHERE created_at::date <= p_date;
  SELECT COUNT(*) INTO v_new_users FROM profiles WHERE created_at::date = p_date;
  SELECT COUNT(DISTINCT user_id) INTO v_active_users FROM bookings WHERE created_at::date = p_date;
  
  -- Provider metrics
  SELECT COUNT(*) INTO v_total_providers FROM providers WHERE created_at::date <= p_date;
  SELECT COUNT(*) INTO v_active_providers FROM providers WHERE is_active = true AND created_at::date <= p_date;
  SELECT COUNT(*) INTO v_new_providers FROM providers WHERE created_at::date = p_date;
  
  -- Booking metrics
  SELECT COUNT(*) INTO v_total_bookings FROM bookings WHERE created_at::date <= p_date;
  SELECT COUNT(*) INTO v_new_bookings FROM bookings WHERE created_at::date = p_date;
  SELECT COUNT(*) INTO v_completed_bookings FROM bookings WHERE status = 'completed' AND updated_at::date = p_date;
  SELECT COUNT(*) INTO v_cancelled_bookings FROM bookings WHERE status = 'cancelled' AND updated_at::date = p_date;
  
  -- Revenue metrics
  SELECT COALESCE(SUM(total_amount), 0) INTO v_gmv FROM bookings WHERE created_at::date = p_date AND status != 'cancelled';
  SELECT COALESCE(SUM(total_amount * 0.10), 0) INTO v_platform_revenue FROM bookings WHERE created_at::date = p_date AND status = 'completed';
  SELECT COALESCE(SUM(
    CASE 
      WHEN sp.price_monthly IS NOT NULL THEN sp.price_monthly 
      ELSE 0 
    END
  ), 0) INTO v_subscription_revenue 
  FROM vendor_subscriptions vs
  JOIN subscription_plans sp ON vs.plan_id = sp.id
  WHERE vs.status = 'active' AND vs.current_period_start::date <= p_date AND vs.current_period_end::date >= p_date;
  
  -- Insert or update metrics
  INSERT INTO platform_metrics (
    date, total_users, new_users, active_users,
    total_providers, active_providers, new_providers,
    total_bookings, new_bookings, completed_bookings, cancelled_bookings,
    gmv, platform_revenue, subscription_revenue
  ) VALUES (
    p_date, v_total_users, v_new_users, v_active_users,
    v_total_providers, v_active_providers, v_new_providers,
    v_total_bookings, v_new_bookings, v_completed_bookings, v_cancelled_bookings,
    v_gmv, v_platform_revenue, v_subscription_revenue
  )
  ON CONFLICT (date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    new_users = EXCLUDED.new_users,
    active_users = EXCLUDED.active_users,
    total_providers = EXCLUDED.total_providers,
    active_providers = EXCLUDED.active_providers,
    new_providers = EXCLUDED.new_providers,
    total_bookings = EXCLUDED.total_bookings,
    new_bookings = EXCLUDED.new_bookings,
    completed_bookings = EXCLUDED.completed_bookings,
    cancelled_bookings = EXCLUDED.cancelled_bookings,
    gmv = EXCLUDED.gmv,
    platform_revenue = EXCLUDED.platform_revenue,
    subscription_revenue = EXCLUDED.subscription_revenue,
    updated_at = now();
END;
$$;
-- Migration: 20260113062910_3689c5c8-6bd4-4b3f-b502-20571bef7215.sql
-- Table for external calendar subscriptions (import from OTA)
CREATE TABLE public.property_external_calendars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL, -- e.g., "Airbnb", "Booking.com"
  ical_url TEXT NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add source field to property_bookings to track where booking came from
ALTER TABLE public.property_bookings 
ADD COLUMN IF NOT EXISTS source_calendar_id UUID REFERENCES public.property_external_calendars(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.property_external_calendars ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Owners can view their own external calendars"
ON public.property_external_calendars
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create external calendars"
ON public.property_external_calendars
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own external calendars"
ON public.property_external_calendars
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own external calendars"
ON public.property_external_calendars
FOR DELETE
USING (auth.uid() = owner_id);

-- Add unique token for iCal export URL (security)
ALTER TABLE public.owner_properties 
ADD COLUMN IF NOT EXISTS ical_token UUID DEFAULT gen_random_uuid();

-- Create index for faster lookups
CREATE INDEX idx_external_calendars_property ON public.property_external_calendars(property_id);
CREATE INDEX idx_properties_ical_token ON public.owner_properties(ical_token);
-- Migration: 20260114044311_62286903-a688-4ca1-bd4d-f71d778c21ca.sql
-- =============================================
-- FIX REMAINING RLS POLICIES (Part 2 - Corrected)
-- =============================================

-- PROPERTY_BOOKINGS - uses owner_id instead of user_id
-- Guest can view their booking, owner can view bookings for their properties
DROP POLICY IF EXISTS "Users and owners can view property bookings" ON public.property_bookings;
DROP POLICY IF EXISTS "Users can view their property bookings" ON public.property_bookings;
DROP POLICY IF EXISTS "Owners can view their property bookings" ON public.property_bookings;

CREATE POLICY "Property owners can view their bookings"
ON public.property_bookings FOR SELECT
USING (
  auth.uid() = owner_id
  OR EXISTS (
    SELECT 1 FROM public.properties p
    JOIN public.providers pr ON p.provider_id = pr.id
    WHERE p.id = property_bookings.property_id 
    AND pr.user_id = auth.uid()
  )
);

-- VENDOR_BOOKINGS - no user_id, has customer info
-- Only provider can view their vendor bookings
DROP POLICY IF EXISTS "Users and vendors can view vendor bookings" ON public.vendor_bookings;
DROP POLICY IF EXISTS "Providers can view their bookings" ON public.vendor_bookings;

CREATE POLICY "Providers can view their vendor bookings"
ON public.vendor_bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.providers pr
    WHERE pr.id = vendor_bookings.provider_id 
    AND pr.user_id = auth.uid()
  )
);

-- Also allow users who made the booking (via bookings table reference)
CREATE POLICY "Users can view their vendor bookings via bookings"
ON public.vendor_bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = vendor_bookings.booking_id 
    AND b.user_id = auth.uid()
  )
);
-- Migration: 20260114044504_81c43b40-6a5a-4da9-89c4-e649aa2ac985.sql
-- =============================================
-- FIX REMAINING CRITICAL SECURITY ISSUES (Part 3b)
-- =============================================

-- BOOKING_PAYMENTS - System-only insert/update policies
DROP POLICY IF EXISTS "System can insert payments" ON public.booking_payments;
DROP POLICY IF EXISTS "System can update payments" ON public.booking_payments;

CREATE POLICY "Only service role can insert payments"
ON public.booking_payments FOR INSERT
WITH CHECK (false);

CREATE POLICY "Only service role can update payments"
ON public.booking_payments FOR UPDATE
USING (false);

-- FEATURED_LISTINGS - Require payment verification via trigger
CREATE OR REPLACE FUNCTION public.validate_featured_listing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stripe_payment_id IS NULL OR NEW.stripe_payment_id = '' THEN
    RAISE EXCEPTION 'Featured listing requires valid payment ID';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_featured_listing_trigger ON public.featured_listings;
CREATE TRIGGER validate_featured_listing_trigger
BEFORE INSERT ON public.featured_listings
FOR EACH ROW
EXECUTE FUNCTION public.validate_featured_listing();

-- VENDOR_PAYOUTS - Validate payout doesn't exceed balance
CREATE OR REPLACE FUNCTION public.validate_vendor_payout()
RETURNS TRIGGER AS $$
DECLARE
  available_balance NUMERIC;
BEGIN
  SELECT COALESCE(pending_payout, 0) INTO available_balance
  FROM public.providers
  WHERE id = NEW.provider_id;
  
  IF NEW.amount > available_balance THEN
    RAISE EXCEPTION 'Payout amount exceeds available balance';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_vendor_payout_trigger ON public.vendor_payouts;
CREATE TRIGGER validate_vendor_payout_trigger
BEFORE INSERT ON public.vendor_payouts
FOR EACH ROW
EXECUTE FUNCTION public.validate_vendor_payout();

-- WALLET_TRANSACTIONS - Restrict insert to system
DROP POLICY IF EXISTS "System can insert wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Only service role can insert transactions"
ON public.wallet_transactions FOR INSERT
WITH CHECK (false);

-- BOOKING_STATUS_HISTORY - Only booking participants can add history
DROP POLICY IF EXISTS "Booking participants can add status history" ON public.booking_status_history;
CREATE POLICY "Booking participants add status history"
ON public.booking_status_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_status_history.booking_id 
    AND (
      b.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.providers pr
        WHERE pr.id = b.provider_id AND pr.user_id = auth.uid()
      )
    )
  )
);

-- ADMIN_AUDIT_LOGS - Only service role can insert
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Only service role can create audit logs"
ON public.admin_audit_logs FOR INSERT
WITH CHECK (false);
-- Migration: 20260114044514_23eb7fe6-0e57-4e02-afe8-414db30387b1.sql
-- Fix function search_path for security
CREATE OR REPLACE FUNCTION public.validate_featured_listing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stripe_payment_id IS NULL OR NEW.stripe_payment_id = '' THEN
    RAISE EXCEPTION 'Featured listing requires valid payment ID';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_vendor_payout()
RETURNS TRIGGER AS $$
DECLARE
  available_balance NUMERIC;
BEGIN
  SELECT COALESCE(pending_payout, 0) INTO available_balance
  FROM public.providers
  WHERE id = NEW.provider_id;
  
  IF NEW.amount > available_balance THEN
    RAISE EXCEPTION 'Payout amount exceeds available balance';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
-- Migration: 20260114060948_fac2319b-4a8f-4a09-8e2e-bf857f270c49.sql
-- SECURITY AUDIT: Restrict profiles table access to own data only
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Only allow users to see their own profile (protects email/phone)
CREATE POLICY "Users can view their own profile only"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Fix booking_participants to only show to booking owner
DROP POLICY IF EXISTS "Users can view participants for their bookings" ON public.booking_participants;
DROP POLICY IF EXISTS "Users can view booking participants" ON public.booking_participants;

CREATE POLICY "Users can only view participants in their own bookings"
ON public.booking_participants FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_participants.booking_id
    AND b.user_id = auth.uid()
  )
);

-- Restrict pharmacy_orders access to owner only
DROP POLICY IF EXISTS "Users can view their own pharmacy orders" ON public.pharmacy_orders;

CREATE POLICY "Users can view only their own pharmacy orders"
ON public.pharmacy_orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Fix partner_applications to restrict access
DROP POLICY IF EXISTS "Users can view their own applications" ON public.partner_applications;

CREATE POLICY "Users can view only their own partner applications"
ON public.partner_applications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Restrict vendor_payouts to vendor only
DROP POLICY IF EXISTS "Vendors can view their own payouts" ON public.vendor_payouts;

CREATE POLICY "Vendors can view only their own payouts"
ON public.vendor_payouts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.id = vendor_payouts.provider_id
    AND p.user_id = auth.uid()
  )
);
-- Migration: 20260114133620_441e3acd-00d6-4c01-ab00-25b69b5321e7.sql
-- Create table for storing user PINs (hashed)
CREATE TABLE public.user_pins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_pins ENABLE ROW LEVEL SECURITY;

-- Users can only view and manage their own PIN
CREATE POLICY "Users can view their own PIN" 
ON public.user_pins 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PIN" 
ON public.user_pins 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PIN" 
ON public.user_pins 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PIN" 
ON public.user_pins 
FOR DELETE 
USING (auth.uid() = user_id);

-- Function to update timestamp
CREATE TRIGGER update_user_pins_updated_at
BEFORE UPDATE ON public.user_pins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to hash PIN and verify (using pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to verify PIN by device
CREATE OR REPLACE FUNCTION public.verify_user_pin(p_user_id UUID, p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT pin_hash INTO stored_hash
  FROM public.user_pins
  WHERE user_id = p_user_id;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN stored_hash = crypt(p_pin, stored_hash);
END;
$$;

-- Function to set PIN
CREATE OR REPLACE FUNCTION public.set_user_pin(p_user_id UUID, p_pin TEXT, p_device_id TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hashed_pin TEXT;
BEGIN
  -- Validate PIN is 6 digits
  IF p_pin !~ '^\d{6}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 6 digits';
  END IF;
  
  -- Hash the PIN
  hashed_pin := crypt(p_pin, gen_salt('bf'));
  
  -- Upsert the PIN
  INSERT INTO public.user_pins (user_id, pin_hash, device_id)
  VALUES (p_user_id, hashed_pin, p_device_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET pin_hash = hashed_pin, device_id = p_device_id, updated_at = now();
  
  RETURN TRUE;
END;
$$;
-- Migration: 20260114135931_ddcd47aa-28c2-4cf6-8d10-8c6873051872.sql
-- Enable pgcrypto extension for password hashing functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Migration: 20260114140105_af3866c3-f691-49b1-8cbe-d6dd54f007d0.sql
-- Fix set_user_pin function to use extensions schema for pgcrypto functions
CREATE OR REPLACE FUNCTION public.set_user_pin(p_user_id uuid, p_pin text, p_device_id text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  hashed_pin TEXT;
BEGIN
  -- Validate PIN is 6 digits
  IF p_pin !~ '^\d{6}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 6 digits';
  END IF;
  
  -- Hash the PIN using extensions.crypt and extensions.gen_salt
  hashed_pin := extensions.crypt(p_pin, extensions.gen_salt('bf'));
  
  -- Upsert the PIN
  INSERT INTO public.user_pins (user_id, pin_hash, device_id)
  VALUES (p_user_id, hashed_pin, p_device_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET pin_hash = hashed_pin, device_id = p_device_id, updated_at = now();
  
  RETURN TRUE;
END;
$function$;

-- Also fix verify_user_pin function
CREATE OR REPLACE FUNCTION public.verify_user_pin(p_user_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  stored_hash TEXT;
BEGIN
  -- Get the stored PIN hash
  SELECT pin_hash INTO stored_hash
  FROM public.user_pins
  WHERE user_id = p_user_id;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verify the PIN using extensions.crypt
  RETURN stored_hash = extensions.crypt(p_pin, stored_hash);
END;
$function$;
-- Migration: 20260116000154_5087712b-1045-445c-a136-6bd66ef6046d.sql
-- =====================================================
-- PHASE 1: Service Orders & Staff Assignment System
-- =====================================================

-- 1. Create service_orders table for guest orders during stay
CREATE TABLE public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE DEFAULT 'SO-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
  
  -- Связи
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  guest_id UUID NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  assigned_to UUID, -- Исполнитель (user_id)
  
  -- Детали заказа
  service_type TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_name_ru TEXT,
  description TEXT,
  
  -- Статус и время
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Финансы
  amount NUMERIC(10,2),
  currency TEXT DEFAULT 'THB',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  
  -- Выполнение
  notes TEXT,
  completion_notes TEXT,
  completion_photos TEXT[],
  
  -- Оценка
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add assignment fields to property_service_requests if not exists
ALTER TABLE public.property_service_requests 
ADD COLUMN IF NOT EXISTS assigned_to UUID,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completion_notes TEXT,
ADD COLUMN IF NOT EXISTS completion_photos TEXT[],
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS review TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- 3. Create staff_profiles table for service providers/executors
CREATE TABLE public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  phone TEXT,
  photo TEXT,
  bio TEXT,
  service_types TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{en}',
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  working_hours JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create service_order_status_history for tracking
CREATE TABLE public.service_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create indexes
CREATE INDEX idx_service_orders_guest ON public.service_orders(guest_id);
CREATE INDEX idx_service_orders_property ON public.service_orders(property_id);
CREATE INDEX idx_service_orders_assigned ON public.service_orders(assigned_to);
CREATE INDEX idx_service_orders_status ON public.service_orders(status);
CREATE INDEX idx_service_orders_scheduled ON public.service_orders(scheduled_at);
CREATE INDEX idx_property_service_requests_assigned ON public.property_service_requests(assigned_to);
CREATE INDEX idx_staff_profiles_user ON public.staff_profiles(user_id);
CREATE INDEX idx_staff_profiles_available ON public.staff_profiles(is_available, is_active);

-- 6. Enable RLS
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_status_history ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for service_orders
CREATE POLICY "Guests can view own orders" ON public.service_orders
  FOR SELECT USING (auth.uid() = guest_id);

CREATE POLICY "Guests can create orders" ON public.service_orders
  FOR INSERT WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Guests can update pending orders" ON public.service_orders
  FOR UPDATE USING (auth.uid() = guest_id AND status = 'pending');

CREATE POLICY "Staff can view assigned orders" ON public.service_orders
  FOR SELECT USING (auth.uid() = assigned_to);

CREATE POLICY "Staff can update assigned orders" ON public.service_orders
  FOR UPDATE USING (auth.uid() = assigned_to);

CREATE POLICY "Admins full access to orders" ON public.service_orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'vendor'))
  );

-- 8. RLS Policies for staff_profiles
CREATE POLICY "Anyone can view active staff" ON public.staff_profiles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can update own profile" ON public.staff_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins manage staff profiles" ON public.staff_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- 9. RLS for status history
CREATE POLICY "View order history" ON public.service_order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.service_orders so 
      WHERE so.id = order_id 
      AND (so.guest_id = auth.uid() OR so.assigned_to = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'vendor'))
  );

CREATE POLICY "Insert order history" ON public.service_order_status_history
  FOR INSERT WITH CHECK (true);

-- 10. Triggers for updated_at
CREATE TRIGGER update_service_orders_updated_at
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_profiles_updated_at
  BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Trigger to log status changes
CREATE OR REPLACE FUNCTION public.log_service_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.service_order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER service_order_status_change
  AFTER UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_service_order_status_change();

-- 12. Enable realtime for service_orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_orders;
ALTER TABLE public.service_orders REPLICA IDENTITY FULL;
-- Migration: 20260116000208_78b36829-a191-4488-8aa5-715c0551eac6.sql
-- Fix overly permissive RLS policy for service_order_status_history INSERT
DROP POLICY IF EXISTS "Insert order history" ON public.service_order_status_history;

CREATE POLICY "Insert order history by authorized users" ON public.service_order_status_history
  FOR INSERT WITH CHECK (
    -- Allow if user is the guest or assignee of the order
    EXISTS (
      SELECT 1 FROM public.service_orders so 
      WHERE so.id = order_id 
      AND (so.guest_id = auth.uid() OR so.assigned_to = auth.uid())
    )
    -- Or if user is admin/staff
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'vendor'))
  );
-- Migration: 20260116122821_7ef4bfa1-cddb-44ff-ac97-2441aaa31607.sql
-- =============================================
-- PHASE 1: GUEST JOURNEY AUTOMATION TABLES
-- =============================================

-- 1. Guest Check-in Data Table
CREATE TABLE public.guest_check_in_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.property_bookings(id) ON DELETE CASCADE,
  user_id UUID, -- optional: linked auth user
  
  -- Passport data
  full_name TEXT,
  passport_number TEXT,
  passport_country TEXT,
  passport_expiry DATE,
  passport_photo_url TEXT,
  
  -- Contacts
  phone TEXT,
  email TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- Arrival info
  arrival_time TEXT,
  arrival_flight TEXT,
  needs_transfer BOOLEAN DEFAULT false,
  
  -- Confirmations
  rules_accepted BOOLEAN DEFAULT false,
  rules_accepted_at TIMESTAMPTZ,
  signature_url TEXT,
  
  -- Status: pending, submitted, verified
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Property Guidebook Table
CREATE TABLE public.property_guidebook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  
  -- WiFi
  wifi_name TEXT,
  wifi_password TEXT,
  
  -- Access codes
  door_code TEXT,
  gate_code TEXT,
  lockbox_code TEXT,
  lockbox_location TEXT,
  
  -- Appliance guides (JSON array)
  appliance_guides JSONB DEFAULT '[]',
  
  -- Emergency contacts (JSON array)
  emergency_contacts JSONB DEFAULT '[]',
  
  -- Local tips and recommendations (JSON array)
  local_tips JSONB DEFAULT '[]',
  
  -- Instructions
  trash_instructions TEXT,
  trash_instructions_ru TEXT,
  parking_instructions TEXT,
  parking_instructions_ru TEXT,
  checkout_instructions TEXT,
  checkout_instructions_ru TEXT,
  
  -- Additional info
  house_manual_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Booking Notifications Log Table
CREATE TABLE public.booking_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.property_bookings(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  
  -- Content
  subject TEXT,
  body TEXT,
  
  -- Status
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Message Templates Table (for owners)
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  
  -- Template info
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  
  -- Content (bilingual)
  subject TEXT,
  subject_ru TEXT,
  body TEXT NOT NULL,
  body_ru TEXT,
  
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.guest_check_in_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_guidebook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guest_check_in_data
-- Users can manage check-in data they created or linked to them
CREATE POLICY "Users can manage their own check-in data"
ON public.guest_check_in_data
FOR ALL
USING (user_id = auth.uid());

-- Property owners can view check-in data for their properties
CREATE POLICY "Property owners can view check-in data"
ON public.guest_check_in_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    JOIN public.owner_properties op ON pb.property_id = op.id
    WHERE pb.id = guest_check_in_data.booking_id
    AND op.owner_id = auth.uid()
  )
);

-- Property owners can update check-in status
CREATE POLICY "Property owners can update check-in status"
ON public.guest_check_in_data
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    JOIN public.owner_properties op ON pb.property_id = op.id
    WHERE pb.id = guest_check_in_data.booking_id
    AND op.owner_id = auth.uid()
  )
);

-- Allow insert for authenticated users
CREATE POLICY "Authenticated users can create check-in data"
ON public.guest_check_in_data
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for property_guidebook
CREATE POLICY "Property owners can manage their guidebooks"
ON public.property_guidebook
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = property_guidebook.property_id
    AND op.owner_id = auth.uid()
  )
);

-- Authenticated users can view guidebook if they have a booking
CREATE POLICY "Users with bookings can view guidebook"
ON public.property_guidebook
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    JOIN public.profiles p ON pb.guest_email = p.email
    WHERE pb.property_id = property_guidebook.property_id
    AND p.id = auth.uid()
    AND pb.status IN ('confirmed', 'checked_in')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.guest_check_in_data gc
    JOIN public.property_bookings pb ON gc.booking_id = pb.id
    WHERE pb.property_id = property_guidebook.property_id
    AND gc.user_id = auth.uid()
  )
);

-- RLS Policies for booking_notifications_log
CREATE POLICY "Property owners can view notifications"
ON public.booking_notifications_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    JOIN public.owner_properties op ON pb.property_id = op.id
    WHERE pb.id = booking_notifications_log.booking_id
    AND op.owner_id = auth.uid()
  )
);

-- Allow insert for service role (edge functions)
CREATE POLICY "System can insert notifications"
ON public.booking_notifications_log
FOR INSERT
WITH CHECK (true);

-- RLS Policies for message_templates
CREATE POLICY "Owners can manage their own templates"
ON public.message_templates
FOR ALL
USING (owner_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_guest_check_in_booking ON public.guest_check_in_data(booking_id);
CREATE INDEX idx_guest_check_in_status ON public.guest_check_in_data(status);
CREATE INDEX idx_guest_check_in_user ON public.guest_check_in_data(user_id);
CREATE INDEX idx_property_guidebook_property ON public.property_guidebook(property_id);
CREATE INDEX idx_booking_notifications_booking ON public.booking_notifications_log(booking_id);
CREATE INDEX idx_booking_notifications_type ON public.booking_notifications_log(notification_type);
CREATE INDEX idx_message_templates_owner ON public.message_templates(owner_id);
CREATE INDEX idx_message_templates_category ON public.message_templates(category);

-- Trigger for updated_at
CREATE TRIGGER update_guest_check_in_updated_at
  BEFORE UPDATE ON public.guest_check_in_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_guidebook_updated_at
  BEFORE UPDATE ON public.property_guidebook
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260116122849_377d7a74-5fc7-4091-a8ba-369d5d45f6a3.sql
-- Fix the permissive INSERT policy for booking_notifications_log
DROP POLICY IF EXISTS "System can insert notifications" ON public.booking_notifications_log;

-- Only allow insert when the booking belongs to an owner's property or the user has a check-in for that booking
CREATE POLICY "Authenticated users can insert notifications for their bookings"
ON public.booking_notifications_log
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    JOIN public.owner_properties op ON pb.property_id = op.id
    WHERE pb.id = booking_notifications_log.booking_id
    AND op.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.guest_check_in_data gc
    WHERE gc.booking_id = booking_notifications_log.booking_id
    AND gc.user_id = auth.uid()
  )
);
-- Migration: 20260116143037_6b3f2c4f-764d-4712-8db9-3393b7d0e336.sql
-- Add unit-specific fields to owner_properties for project integration
ALTER TABLE public.owner_properties
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES property_projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS floor integer,
ADD COLUMN IF NOT EXISTS unit_number text,
ADD COLUMN IF NOT EXISTS view_type text,
ADD COLUMN IF NOT EXISTS furnishing_level text,
ADD COLUMN IF NOT EXISTS equipment text[],
ADD COLUMN IF NOT EXISTS lat numeric,
ADD COLUMN IF NOT EXISTS lng numeric;

-- Create index for project lookup
CREATE INDEX IF NOT EXISTS idx_owner_properties_project_id ON public.owner_properties(project_id);

-- Add comments
COMMENT ON COLUMN public.owner_properties.project_id IS 'Reference to property project/complex';
COMMENT ON COLUMN public.owner_properties.floor IS 'Floor number of the unit';
COMMENT ON COLUMN public.owner_properties.unit_number IS 'Unit/apartment number within the project';
COMMENT ON COLUMN public.owner_properties.view_type IS 'Type of view (sea, pool, garden, etc.)';
COMMENT ON COLUMN public.owner_properties.furnishing_level IS 'Furnishing level (unfurnished, partially, fully, luxury)';
COMMENT ON COLUMN public.owner_properties.equipment IS 'List of equipment/appliances included';
COMMENT ON COLUMN public.owner_properties.lat IS 'Latitude coordinate';
COMMENT ON COLUMN public.owner_properties.lng IS 'Longitude coordinate';
-- Migration: 20260116145547_d8663cd3-90c2-4dcc-a134-0f12ec4ec270.sql
-- Create atomic wallet payment function to prevent race conditions
CREATE OR REPLACE FUNCTION public.pay_from_wallet_atomic(
  p_user_id uuid,
  p_amount numeric,
  p_description text,
  p_description_ru text,
  p_reference_type text DEFAULT NULL,
  p_reference_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet_id UUID;
  v_balance NUMERIC;
  v_new_balance NUMERIC;
  v_transaction_id UUID;
  v_currency TEXT;
BEGIN
  -- Get wallet with row-level lock to prevent race conditions
  SELECT id, balance, currency INTO v_wallet_id, v_balance, v_currency
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'wallet_not_found',
      'message', 'Wallet not found for user'
    );
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_balance',
      'message', 'Insufficient wallet balance',
      'available_balance', v_balance,
      'requested_amount', p_amount
    );
  END IF;

  -- Calculate new balance
  v_new_balance := v_balance - p_amount;

  -- Update wallet balance atomically
  UPDATE public.wallets
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_wallet_id;

  -- Create transaction record
  INSERT INTO public.wallet_transactions (
    wallet_id,
    user_id,
    type,
    amount,
    currency,
    description,
    description_ru,
    reference_type,
    reference_id,
    status
  ) VALUES (
    v_wallet_id,
    p_user_id,
    'payment',
    p_amount,
    v_currency,
    p_description,
    p_description_ru,
    p_reference_type,
    p_reference_id,
    'completed'
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance,
    'amount_paid', p_amount,
    'currency', v_currency
  );
END;
$function$;

-- Update handle_new_user_wallet to use THB consistently (Thailand market)
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create wallet for new user with 0 balance - use THB for Thailand market
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'THB')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Update get_or_create_wallet to use THB as default
CREATE OR REPLACE FUNCTION public.get_or_create_wallet(p_user_id uuid)
RETURNS wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet public.wallets;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id;
  
  IF v_wallet IS NULL THEN
    INSERT INTO public.wallets (user_id, balance, currency)
    VALUES (p_user_id, 0, 'THB')
    RETURNING * INTO v_wallet;
  END IF;
  
  RETURN v_wallet;
END;
$function$;

-- Add comment explaining the atomic payment function
COMMENT ON FUNCTION public.pay_from_wallet_atomic IS 'Atomic wallet payment with row-level locking to prevent race conditions';
-- Migration: 20260119042142_c1535ed5-ce1d-455e-aa79-81a5b1b7de1e.sql
-- =====================================================
-- UNO CLEAN CORE ARCHITECTURE - CANONICAL SCHEMA
-- =====================================================

-- 1️⃣ IDENTITY & ACCESS LAYER
-- =====================================================

-- Organizations table (vendors, owners, operators)
CREATE TABLE IF NOT EXISTS public.orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ru TEXT,
  org_type TEXT NOT NULL CHECK (org_type IN ('vendor', 'owner', 'operator', 'platform')),
  logo_url TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Organization members (user-org relationship)
CREATE TABLE IF NOT EXISTS public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- User active context (replaces localStorage role switching)
CREATE TABLE IF NOT EXISTS public.user_active_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  active_role TEXT NOT NULL DEFAULT 'user',
  active_org_id UUID REFERENCES public.orgs(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2️⃣ CANONICAL CATALOG LAYER
-- =====================================================

-- Products table (unified: services, tours, properties, yachts, transport)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.orgs(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id),
  product_type TEXT NOT NULL CHECK (product_type IN (
    'service', 'tour', 'property', 'yacht', 'vehicle', 
    'event', 'activity', 'beauty', 'cleaning', 'babysitter',
    'education', 'medical', 'legal', 'pet_service', 'flowers', 'food'
  )),
  name_en TEXT NOT NULL,
  name_ru TEXT,
  description_en TEXT,
  description_ru TEXT,
  cover_image TEXT,
  images TEXT[],
  base_price NUMERIC(12,2),
  currency TEXT DEFAULT 'THB',
  duration_minutes INTEGER,
  max_capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Resources table (physical assets: villas, yachts, cars)
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('property_unit', 'yacht', 'vehicle', 'room', 'equipment')),
  name_en TEXT NOT NULL,
  name_ru TEXT,
  capacity INTEGER,
  location TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  is_available BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product-Resource links (which products use which resources)
CREATE TABLE IF NOT EXISTS public.product_resource_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, resource_id)
);

-- Product availability
CREATE TABLE IF NOT EXISTS public.product_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  slots_available INTEGER DEFAULT 1,
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3️⃣ CANONICAL ORDER CORE (MOST IMPORTANT)
-- =====================================================

-- Order status enum
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'draft', 'pending', 'confirmed', 'in_progress', 
    'completed', 'cancelled', 'refunded', 'disputed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Order item status enum
DO $$ BEGIN
  CREATE TYPE order_item_status AS ENUM (
    'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Canonical orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  order_type TEXT NOT NULL CHECK (order_type IN (
    'service', 'tour', 'property', 'yacht', 'vehicle', 
    'event', 'activity', 'beauty', 'cleaning', 'babysitter',
    'education', 'medical', 'legal', 'pet_service', 'flowers', 'food', 'mixed'
  )),
  customer_user_id UUID NOT NULL,
  provider_org_id UUID REFERENCES public.orgs(id),
  status order_status DEFAULT 'pending',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  subtotal NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'THB',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order items (line items for each product/service in order)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  resource_id UUID REFERENCES public.resources(id),
  provider_org_id UUID REFERENCES public.orgs(id),
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL,
  qty INTEGER DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status order_item_status DEFAULT 'pending',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Order participants (guests, attendees)
CREATE TABLE IF NOT EXISTS public.order_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('primary', 'guest', 'attendee', 'driver', 'guide')),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Order addresses (pickup, service location, dropoff)
CREATE TABLE IF NOT EXISTS public.order_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL CHECK (address_type IN ('pickup', 'service', 'dropoff', 'billing')),
  address_text TEXT NOT NULL,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Order status history
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  actor_user_id UUID,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4️⃣ PAYMENTS & LEDGER
-- =====================================================

-- Payment method enum
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'wallet', 'stripe', 'bank_transfer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payment status enum  
DO $$ BEGIN
  CREATE TYPE intent_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payment intents (connected to orders)
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'THB',
  method payment_method NOT NULL,
  status intent_status DEFAULT 'pending',
  provider_ref TEXT, -- Stripe payment intent ID
  provider_session_id TEXT, -- Stripe checkout session ID
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ledger accounts
CREATE TABLE IF NOT EXISTS public.ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type TEXT NOT NULL CHECK (account_type IN ('user_wallet', 'vendor_balance', 'platform_revenue', 'escrow', 'refund_reserve')),
  owner_user_id UUID,
  owner_org_id UUID REFERENCES public.orgs(id),
  balance NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'THB',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT owner_check CHECK (
    (owner_user_id IS NOT NULL AND owner_org_id IS NULL) OR
    (owner_user_id IS NULL AND owner_org_id IS NOT NULL) OR
    (owner_user_id IS NULL AND owner_org_id IS NULL AND account_type IN ('platform_revenue', 'escrow', 'refund_reserve'))
  )
);

-- Ledger entries (double-entry bookkeeping)
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debit_account_id UUID NOT NULL REFERENCES public.ledger_accounts(id),
  credit_account_id UUID NOT NULL REFERENCES public.ledger_accounts(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'THB',
  order_id UUID REFERENCES public.orders(id),
  payment_intent_id UUID REFERENCES public.payment_intents(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('payment', 'refund', 'payout', 'fee', 'adjustment', 'topup')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5️⃣ VERTICAL DETAIL TABLES (1:1 with order_items)
-- =====================================================

-- Property booking details
CREATE TABLE IF NOT EXISTS public.order_item_property_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL UNIQUE REFERENCES public.order_items(id) ON DELETE CASCADE,
  check_in_date DATE,
  check_out_date DATE,
  guests_count INTEGER,
  rooms_count INTEGER,
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transport booking details
CREATE TABLE IF NOT EXISTS public.order_item_transport_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL UNIQUE REFERENCES public.order_items(id) ON DELETE CASCADE,
  vehicle_type TEXT,
  pickup_time TIMESTAMPTZ,
  flight_number TEXT,
  passenger_count INTEGER,
  luggage_count INTEGER,
  is_round_trip BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Yacht charter details
CREATE TABLE IF NOT EXISTS public.order_item_yacht_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL UNIQUE REFERENCES public.order_items(id) ON DELETE CASCADE,
  charter_type TEXT CHECK (charter_type IN ('half_day', 'full_day', 'sunset', 'overnight')),
  guests_count INTEGER,
  crew_included BOOLEAN DEFAULT true,
  catering_included BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6️⃣ INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_provider ON public.orders(provider_org_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_order ON public.payment_intents(order_id);
CREATE INDEX IF NOT EXISTS idx_products_org ON public.products(org_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(product_type);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_active_context_user ON public.user_active_context(user_id);

-- 7️⃣ ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_active_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_resource_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_property_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_transport_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_yacht_details ENABLE ROW LEVEL SECURITY;

-- 8️⃣ RLS POLICIES
-- =====================================================

-- Orgs: anyone can read active orgs, members can manage
CREATE POLICY "Anyone can view active orgs" ON public.orgs FOR SELECT USING (is_active = true);
CREATE POLICY "Org admins can update their org" ON public.orgs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = orgs.id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Org members: users can see their own memberships
CREATE POLICY "Users can view own memberships" ON public.org_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Org owners can manage members" ON public.org_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = org_members.org_id AND om.user_id = auth.uid() AND om.role = 'owner')
);

-- User active context: users manage their own
CREATE POLICY "Users manage own context" ON public.user_active_context FOR ALL USING (user_id = auth.uid());

-- Products: anyone can read active, org members can manage
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Org members can manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = products.org_id AND user_id = auth.uid())
);

-- Resources: org members can manage
CREATE POLICY "Anyone can view resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Org members can manage resources" ON public.resources FOR ALL USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = resources.org_id AND user_id = auth.uid())
);

-- Product resource links
CREATE POLICY "Anyone can view product links" ON public.product_resource_links FOR SELECT USING (true);

-- Product availability
CREATE POLICY "Anyone can view availability" ON public.product_availability FOR SELECT USING (true);

-- Orders: customers see own, vendors see orders for their org
CREATE POLICY "Customers view own orders" ON public.orders FOR SELECT USING (customer_user_id = auth.uid());
CREATE POLICY "Vendors view org orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = orders.provider_org_id AND user_id = auth.uid())
);
CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT WITH CHECK (customer_user_id = auth.uid());
CREATE POLICY "Order owners can update" ON public.orders FOR UPDATE USING (
  customer_user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = orders.provider_org_id AND user_id = auth.uid())
);

-- Order items
CREATE POLICY "View order items via order" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND (customer_user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.org_members WHERE org_id = orders.provider_org_id AND user_id = auth.uid())))
);
CREATE POLICY "Create order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND customer_user_id = auth.uid())
);

-- Order participants
CREATE POLICY "View participants via order" ON public.order_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_participants.order_id AND customer_user_id = auth.uid())
);
CREATE POLICY "Create participants" ON public.order_participants FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_participants.order_id AND customer_user_id = auth.uid())
);

-- Order addresses
CREATE POLICY "View addresses via order" ON public.order_addresses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_addresses.order_id AND customer_user_id = auth.uid())
);
CREATE POLICY "Create addresses" ON public.order_addresses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_addresses.order_id AND customer_user_id = auth.uid())
);

-- Order status history
CREATE POLICY "View status history" ON public.order_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_status_history.order_id AND customer_user_id = auth.uid())
);

-- Payment intents
CREATE POLICY "View own payment intents" ON public.payment_intents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = payment_intents.order_id AND customer_user_id = auth.uid())
);
CREATE POLICY "Create payment intents" ON public.payment_intents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = payment_intents.order_id AND customer_user_id = auth.uid())
);

-- Ledger accounts: users see own wallet
CREATE POLICY "Users view own accounts" ON public.ledger_accounts FOR SELECT USING (owner_user_id = auth.uid());
CREATE POLICY "Orgs view own accounts" ON public.ledger_accounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = ledger_accounts.owner_org_id AND user_id = auth.uid())
);

-- Ledger entries
CREATE POLICY "View entries for own accounts" ON public.ledger_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ledger_accounts WHERE (id = ledger_entries.debit_account_id OR id = ledger_entries.credit_account_id) AND owner_user_id = auth.uid())
);

-- Order item details
CREATE POLICY "View property details" ON public.order_item_property_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id 
    WHERE oi.id = order_item_property_details.order_item_id AND o.customer_user_id = auth.uid())
);
CREATE POLICY "View transport details" ON public.order_item_transport_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id 
    WHERE oi.id = order_item_transport_details.order_item_id AND o.customer_user_id = auth.uid())
);
CREATE POLICY "View yacht details" ON public.order_item_yacht_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id 
    WHERE oi.id = order_item_yacht_details.order_item_id AND o.customer_user_id = auth.uid())
);

-- 9️⃣ AUTO-GENERATE ORDER NUMBER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'UNO-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_order_number ON public.orders;
CREATE TRIGGER tr_generate_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION public.generate_order_number();

-- 🔟 UPDATE TIMESTAMPS TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_orders_updated ON public.orders;
CREATE TRIGGER tr_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tr_orgs_updated ON public.orgs;
CREATE TRIGGER tr_orgs_updated BEFORE UPDATE ON public.orgs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tr_products_updated ON public.products;
CREATE TRIGGER tr_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tr_resources_updated ON public.resources;
CREATE TRIGGER tr_resources_updated BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tr_payment_intents_updated ON public.payment_intents;
CREATE TRIGGER tr_payment_intents_updated BEFORE UPDATE ON public.payment_intents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tr_ledger_accounts_updated ON public.ledger_accounts;
CREATE TRIGGER tr_ledger_accounts_updated BEFORE UPDATE ON public.ledger_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
-- Migration: 20260119042155_7e1c681a-588d-4f88-821c-27a6c0a0744d.sql
-- Fix function search_path for security
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.order_number := 'UNO-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
SECURITY DEFINER  
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Migration: 20260119053257_9df1b8ef-09eb-4123-8283-76af36bf36de.sql
-- =====================================================
-- P0 FIX: LEGACY BOOKING TABLE WRITE BLOCKING
-- =====================================================

-- Block INSERT/UPDATE on tour_bookings
CREATE OR REPLACE FUNCTION public.block_deprecated_tour_bookings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Deprecated — use orders table. tour_bookings is no longer accepting writes.';
END;
$$;

DROP TRIGGER IF EXISTS block_tour_bookings_insert ON public.tour_bookings;
CREATE TRIGGER block_tour_bookings_insert
  BEFORE INSERT OR UPDATE ON public.tour_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.block_deprecated_tour_bookings();

-- Block INSERT/UPDATE on event_bookings
CREATE OR REPLACE FUNCTION public.block_deprecated_event_bookings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Deprecated — use orders table. event_bookings is no longer accepting writes.';
END;
$$;

DROP TRIGGER IF EXISTS block_event_bookings_insert ON public.event_bookings;
CREATE TRIGGER block_event_bookings_insert
  BEFORE INSERT OR UPDATE ON public.event_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.block_deprecated_event_bookings();

-- Block INSERT/UPDATE on property_bookings
CREATE OR REPLACE FUNCTION public.block_deprecated_property_bookings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Deprecated — use orders table. property_bookings is no longer accepting writes.';
END;
$$;

DROP TRIGGER IF EXISTS block_property_bookings_insert ON public.property_bookings;
CREATE TRIGGER block_property_bookings_insert
  BEFORE INSERT OR UPDATE ON public.property_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.block_deprecated_property_bookings();

-- Block INSERT/UPDATE on water_activity_bookings
CREATE OR REPLACE FUNCTION public.block_deprecated_water_bookings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Deprecated — use orders table. water_activity_bookings is no longer accepting writes.';
END;
$$;

DROP TRIGGER IF EXISTS block_water_bookings_insert ON public.water_activity_bookings;
CREATE TRIGGER block_water_bookings_insert
  BEFORE INSERT OR UPDATE ON public.water_activity_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.block_deprecated_water_bookings();


-- =====================================================
-- P0 FIX: STRENGTHEN RLS POLICIES
-- =====================================================

-- Admin access to orders (full CRUD)
DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
CREATE POLICY "Admins have full access to orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Owner access to orders (via resource_id in order_items linked to resources.org_id)
DROP POLICY IF EXISTS "Owners view orders with owned resources" ON public.orders;
CREATE POLICY "Owners view orders with owned resources"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN resources r ON r.id = oi.resource_id
      JOIN org_members om ON om.org_id = r.org_id
      WHERE oi.order_id = orders.id
        AND om.user_id = auth.uid()
    )
  );

-- Vendor update access
DROP POLICY IF EXISTS "Vendors can update own org orders" ON public.orders;
CREATE POLICY "Vendors can update own org orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    provider_org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Admin access to order_items
DROP POLICY IF EXISTS "Admins have full access to order_items" ON public.order_items;
CREATE POLICY "Admins have full access to order_items"
  ON public.order_items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Vendor access to own org order items
DROP POLICY IF EXISTS "Vendors view own org order items" ON public.order_items;
CREATE POLICY "Vendors view own org order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    provider_org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Owner access to order items with owned resources
DROP POLICY IF EXISTS "Owners view order items with owned resources" ON public.order_items;
CREATE POLICY "Owners view order items with owned resources"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    resource_id IN (
      SELECT r.id FROM resources r
      JOIN org_members om ON om.org_id = r.org_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Admin access to payment_intents
DROP POLICY IF EXISTS "Admins have full access to payment_intents" ON public.payment_intents;
CREATE POLICY "Admins have full access to payment_intents"
  ON public.payment_intents FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin access to ledger_accounts
DROP POLICY IF EXISTS "Admins have full access to ledger_accounts" ON public.ledger_accounts;
CREATE POLICY "Admins have full access to ledger_accounts"
  ON public.ledger_accounts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin access to ledger_entries  
DROP POLICY IF EXISTS "Admins have full access to ledger_entries" ON public.ledger_entries;
CREATE POLICY "Admins have full access to ledger_entries"
  ON public.ledger_entries FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Vendors view their org's ledger entries
DROP POLICY IF EXISTS "Vendors view org ledger entries" ON public.ledger_entries;
CREATE POLICY "Vendors view org ledger entries"
  ON public.ledger_entries FOR SELECT
  TO authenticated
  USING (
    credit_account_id IN (
      SELECT la.id FROM ledger_accounts la
      JOIN org_members om ON om.org_id = la.owner_org_id
      WHERE om.user_id = auth.uid()
    )
    OR
    debit_account_id IN (
      SELECT la.id FROM ledger_accounts la
      JOIN org_members om ON om.org_id = la.owner_org_id
      WHERE om.user_id = auth.uid()
    )
  );
-- Migration: 20260120011942_d9d8a50c-fba1-4968-a1b2-6bbc66f320fb.sql
-- Phase 2: Availability Check Functions

-- 2.1 Check yacht availability (date range overlap)
CREATE OR REPLACE FUNCTION public.check_yacht_availability(
  p_yacht_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_exclude_order_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_conflict_count
  FROM orders o
  WHERE o.vertical = 'yacht'
    AND o.entity_id = p_yacht_id
    AND o.status NOT IN ('cancelled', 'refunded')
    AND (p_exclude_order_id IS NULL OR o.id != p_exclude_order_id)
    AND (
      (o.scheduled_start::date, COALESCE(o.scheduled_end::date, o.scheduled_start::date)) 
      OVERLAPS 
      (p_start_date, p_end_date)
    );
  
  RETURN v_conflict_count = 0;
END;
$$;

-- 2.2 Check tour availability (date + max participants)
CREATE OR REPLACE FUNCTION public.check_tour_availability(
  p_tour_id UUID,
  p_date DATE,
  p_participants INTEGER,
  p_exclude_order_id UUID DEFAULT NULL
)
RETURNS TABLE(available BOOLEAN, spots_remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_spots INTEGER;
  v_booked_spots INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Get max spots from tours table
  SELECT COALESCE(t.max_group_size, 20) INTO v_max_spots
  FROM tours t
  WHERE t.id = p_tour_id;
  
  IF v_max_spots IS NULL THEN
    v_max_spots := 20; -- Default if tour not found
  END IF;
  
  -- Count already booked participants for this date
  SELECT COALESCE(SUM((o.metadata->>'participants')::integer), 0) INTO v_booked_spots
  FROM orders o
  WHERE o.vertical = 'tour'
    AND o.entity_id = p_tour_id
    AND o.scheduled_start::date = p_date
    AND o.status NOT IN ('cancelled', 'refunded')
    AND (p_exclude_order_id IS NULL OR o.id != p_exclude_order_id);
  
  v_remaining := v_max_spots - v_booked_spots;
  
  RETURN QUERY SELECT 
    (v_remaining >= p_participants) AS available,
    v_remaining AS spots_remaining;
END;
$$;

-- 2.3 Check service slot availability (datetime slot)
CREATE OR REPLACE FUNCTION public.check_service_slot_availability(
  p_service_id UUID,
  p_provider_id UUID,
  p_datetime TIMESTAMPTZ,
  p_duration_minutes INTEGER DEFAULT 60,
  p_exclude_order_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict_count INTEGER;
  v_end_time TIMESTAMPTZ;
BEGIN
  v_end_time := p_datetime + (p_duration_minutes || ' minutes')::interval;
  
  SELECT COUNT(*) INTO v_conflict_count
  FROM orders o
  WHERE o.vertical IN ('service', 'beauty', 'cleaning', 'medical', 'education', 'legal', 'fitness')
    AND o.provider_id = p_provider_id
    AND o.status NOT IN ('cancelled', 'refunded')
    AND (p_exclude_order_id IS NULL OR o.id != p_exclude_order_id)
    AND (
      (o.scheduled_start, o.scheduled_start + ((COALESCE(o.metadata->>'duration_minutes', '60'))::integer || ' minutes')::interval)
      OVERLAPS
      (p_datetime, v_end_time)
    );
  
  RETURN v_conflict_count = 0;
END;
$$;

-- 2.4 Universal availability check wrapper
CREATE OR REPLACE FUNCTION public.check_availability(
  p_vertical TEXT,
  p_entity_id UUID,
  p_provider_id UUID,
  p_start_datetime TIMESTAMPTZ,
  p_end_datetime TIMESTAMPTZ DEFAULT NULL,
  p_participants INTEGER DEFAULT 1,
  p_exclude_order_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_available BOOLEAN;
  v_spots INTEGER;
BEGIN
  CASE p_vertical
    WHEN 'yacht' THEN
      v_available := check_yacht_availability(
        p_entity_id,
        p_start_datetime::date,
        COALESCE(p_end_datetime, p_start_datetime)::date,
        p_exclude_order_id
      );
      v_result := jsonb_build_object('available', v_available);
      
    WHEN 'tour' THEN
      SELECT available, spots_remaining INTO v_available, v_spots
      FROM check_tour_availability(
        p_entity_id,
        p_start_datetime::date,
        p_participants,
        p_exclude_order_id
      );
      v_result := jsonb_build_object('available', v_available, 'spots_remaining', v_spots);
      
    WHEN 'property' THEN
      v_available := check_property_availability(
        p_entity_id,
        p_start_datetime::date,
        COALESCE(p_end_datetime, p_start_datetime)::date
      );
      v_result := jsonb_build_object('available', v_available);
      
    ELSE
      -- Services with time slots
      v_available := check_service_slot_availability(
        p_entity_id,
        p_provider_id,
        p_start_datetime,
        EXTRACT(EPOCH FROM (COALESCE(p_end_datetime, p_start_datetime + interval '1 hour') - p_start_datetime)) / 60,
        p_exclude_order_id
      );
      v_result := jsonb_build_object('available', v_available);
  END CASE;
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_yacht_availability TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_tour_availability TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_service_slot_availability TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_availability TO authenticated;
-- Migration: 20260120012021_d6b6dd4f-1729-4363-a00d-62ddbbfca2a1.sql
-- Phase 3: Automatic Cashback via Ledger System

-- 3.1 Function to calculate and credit cashback
CREATE OR REPLACE FUNCTION public.credit_cashback(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_cashback_settings RECORD;
  v_cashback_amount NUMERIC;
  v_wallet_account_id UUID;
  v_platform_cashback_account_id UUID;
  v_entry_id UUID;
BEGIN
  -- Get order details
  SELECT o.*, u.id as user_id
  INTO v_order
  FROM orders o
  JOIN auth.users u ON o.customer_id = u.id
  WHERE o.id = p_order_id;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  -- Check if cashback already credited for this order
  IF EXISTS (
    SELECT 1 FROM ledger_entries 
    WHERE reference_id = p_order_id 
    AND entry_type = 'cashback'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cashback already credited');
  END IF;
  
  -- Get cashback settings for this vertical
  SELECT * INTO v_cashback_settings
  FROM cashback_settings
  WHERE category = v_order.vertical AND is_active = true;
  
  -- Fallback to default settings
  IF v_cashback_settings IS NULL THEN
    SELECT * INTO v_cashback_settings
    FROM cashback_settings
    WHERE category = 'default' AND is_active = true;
  END IF;
  
  IF v_cashback_settings IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No cashback settings found');
  END IF;
  
  -- Check minimum order amount
  IF v_order.total_amount < COALESCE(v_cashback_settings.min_order_amount, 0) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order below minimum for cashback');
  END IF;
  
  -- Calculate cashback
  v_cashback_amount := v_order.total_amount * (v_cashback_settings.percentage / 100.0);
  
  -- Apply maximum cap if set
  IF v_cashback_settings.max_cashback_amount IS NOT NULL AND 
     v_cashback_amount > v_cashback_settings.max_cashback_amount THEN
    v_cashback_amount := v_cashback_settings.max_cashback_amount;
  END IF;
  
  -- Round to 2 decimal places
  v_cashback_amount := ROUND(v_cashback_amount, 2);
  
  IF v_cashback_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cashback amount is zero');
  END IF;
  
  -- Get or create user's wallet ledger account
  SELECT id INTO v_wallet_account_id
  FROM ledger_accounts
  WHERE user_id = v_order.customer_id AND account_type = 'wallet';
  
  IF v_wallet_account_id IS NULL THEN
    INSERT INTO ledger_accounts (user_id, account_type, currency, balance)
    VALUES (v_order.customer_id, 'wallet', COALESCE(v_order.currency, 'THB'), 0)
    RETURNING id INTO v_wallet_account_id;
  END IF;
  
  -- Get platform cashback expense account
  SELECT id INTO v_platform_cashback_account_id
  FROM ledger_accounts
  WHERE account_type = 'platform_cashback' AND user_id IS NULL;
  
  IF v_platform_cashback_account_id IS NULL THEN
    INSERT INTO ledger_accounts (account_type, currency, balance)
    VALUES ('platform_cashback', 'THB', 0)
    RETURNING id INTO v_platform_cashback_account_id;
  END IF;
  
  -- Create double-entry ledger entries
  -- Debit: Platform cashback expense
  INSERT INTO ledger_entries (
    account_id, entry_type, amount, currency, 
    reference_type, reference_id, description
  ) VALUES (
    v_platform_cashback_account_id, 'cashback', -v_cashback_amount, 
    COALESCE(v_order.currency, 'THB'), 'order', p_order_id,
    'Cashback expense for order ' || v_order.order_number
  );
  
  -- Credit: User wallet
  INSERT INTO ledger_entries (
    account_id, entry_type, amount, currency,
    reference_type, reference_id, description
  ) VALUES (
    v_wallet_account_id, 'cashback', v_cashback_amount,
    COALESCE(v_order.currency, 'THB'), 'order', p_order_id,
    'Cashback earned for order ' || v_order.order_number
  ) RETURNING id INTO v_entry_id;
  
  -- Update wallet balance
  UPDATE ledger_accounts
  SET balance = balance + v_cashback_amount,
      updated_at = now()
  WHERE id = v_wallet_account_id;
  
  -- Also update wallets table for backwards compatibility
  UPDATE wallets
  SET balance = balance + v_cashback_amount,
      updated_at = now()
  WHERE user_id = v_order.customer_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'cashback_amount', v_cashback_amount,
    'order_id', p_order_id,
    'entry_id', v_entry_id
  );
END;
$$;

-- 3.2 Trigger function for automatic cashback on order completion
CREATE OR REPLACE FUNCTION public.trigger_order_cashback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Credit cashback
    v_result := credit_cashback(NEW.id);
    
    -- Log the result (non-blocking)
    IF NOT (v_result->>'success')::boolean THEN
      RAISE NOTICE 'Cashback not credited for order %: %', NEW.id, v_result->>'error';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3.3 Create trigger on orders table
DROP TRIGGER IF EXISTS orders_cashback_trigger ON orders;
CREATE TRIGGER orders_cashback_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_order_cashback();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.credit_cashback TO authenticated;
-- Migration: 20260120020954_96ab9712-70bf-47c6-90c2-88f31e8b9932.sql
-- Create universal lookup_values table for managing all reference data
CREATE TABLE public.lookup_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lookup_type TEXT NOT NULL, -- 'district', 'cuisine', 'tour_type', 'amenity', 'property_type', etc.
  value_key TEXT NOT NULL, -- slug/key for code usage
  value_en TEXT NOT NULL, -- English display name
  value_ru TEXT, -- Russian display name
  icon TEXT, -- optional icon name from lucide
  color TEXT, -- optional color
  parent_id UUID REFERENCES public.lookup_values(id), -- for hierarchical data
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}', -- extra data per type
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lookup_type, value_key)
);

-- Enable RLS
ALTER TABLE public.lookup_values ENABLE ROW LEVEL SECURITY;

-- Everyone can read lookup values (public reference data)
CREATE POLICY "Anyone can read lookup values"
ON public.lookup_values
FOR SELECT
USING (true);

-- Only admins can manage lookup values
CREATE POLICY "Admins can manage lookup values"
ON public.lookup_values
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_lookup_values_updated_at
BEFORE UPDATE ON public.lookup_values
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create index for fast lookup by type
CREATE INDEX idx_lookup_values_type ON public.lookup_values(lookup_type);
CREATE INDEX idx_lookup_values_active ON public.lookup_values(is_active, lookup_type);

-- Seed initial data from existing values

-- Districts (from properties)
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, sort_order) VALUES
('district', 'patong', 'Patong', 'Патонг', 1),
('district', 'karon', 'Karon', 'Карон', 2),
('district', 'kata', 'Kata', 'Ката', 3),
('district', 'kamala', 'Kamala', 'Камала', 4),
('district', 'surin', 'Surin', 'Сурин', 5),
('district', 'bang-tao', 'Bang Tao', 'Банг Тао', 6),
('district', 'layan', 'Layan', 'Лаян', 7),
('district', 'nai-harn', 'Nai Harn', 'Най Харн', 8),
('district', 'rawai', 'Rawai', 'Равай', 9),
('district', 'chalong', 'Chalong', 'Чалонг', 10),
('district', 'phuket-town', 'Phuket Town', 'Пхукет Таун', 11),
('district', 'cherngtalay', 'Cherngtalay', 'Чернгталай', 12),
('district', 'thalang', 'Thalang', 'Таланг', 13),
('district', 'kathu', 'Kathu', 'Кату', 14),
('district', 'naithon', 'Naithon', 'Найтон', 15),
('district', 'ao-po', 'Ao Po', 'Ао По', 16),
('district', 'koh-kaew', 'Koh Kaew', 'Ко Кео', 17);

-- Cuisines
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, sort_order) VALUES
('cuisine', 'thai', 'Thai', 'Тайская', 1),
('cuisine', 'italian', 'Italian', 'Итальянская', 2),
('cuisine', 'japanese', 'Japanese', 'Японская', 3),
('cuisine', 'indian', 'Indian', 'Индийская', 4),
('cuisine', 'seafood', 'Seafood', 'Морепродукты', 5),
('cuisine', 'chinese', 'Chinese', 'Китайская', 6),
('cuisine', 'french', 'French', 'Французская', 7),
('cuisine', 'korean', 'Korean', 'Корейская', 8),
('cuisine', 'mexican', 'Mexican', 'Мексиканская', 9),
('cuisine', 'mediterranean', 'Mediterranean', 'Средиземноморская', 10),
('cuisine', 'international', 'International', 'Интернациональная', 11),
('cuisine', 'russian', 'Russian', 'Русская', 12),
('cuisine', 'american', 'American', 'Американская', 13),
('cuisine', 'vegetarian', 'Vegetarian', 'Вегетарианская', 14);

-- Tour types
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, sort_order) VALUES
('tour_type', 'island-hopping', 'Island Hopping', 'По островам', 1),
('tour_type', 'snorkeling', 'Snorkeling', 'Снорклинг', 2),
('tour_type', 'diving', 'Diving', 'Дайвинг', 3),
('tour_type', 'cultural', 'Cultural', 'Культурный', 4),
('tour_type', 'adventure', 'Adventure', 'Приключенческий', 5),
('tour_type', 'city-tour', 'City Tour', 'Городской тур', 6),
('tour_type', 'sunset-cruise', 'Sunset Cruise', 'Закатный круиз', 7),
('tour_type', 'fishing', 'Fishing', 'Рыбалка', 8),
('tour_type', 'elephant-sanctuary', 'Elephant Sanctuary', 'Слоновий заповедник', 9),
('tour_type', 'temple-tour', 'Temple Tour', 'Храмовый тур', 10),
('tour_type', 'cooking-class', 'Cooking Class', 'Кулинарный мастер-класс', 11),
('tour_type', 'kayaking', 'Kayaking', 'Каякинг', 12);

-- Property amenities
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, sort_order) VALUES
('amenity', 'pool', 'Swimming Pool', 'Бассейн', 1),
('amenity', 'wifi', 'WiFi', 'WiFi', 2),
('amenity', 'parking', 'Parking', 'Парковка', 3),
('amenity', 'gym', 'Gym', 'Тренажерный зал', 4),
('amenity', 'air-conditioning', 'Air Conditioning', 'Кондиционер', 5),
('amenity', 'kitchen', 'Kitchen', 'Кухня', 6),
('amenity', 'washer', 'Washer', 'Стиральная машина', 7),
('amenity', 'sea-view', 'Sea View', 'Вид на море', 8),
('amenity', 'balcony', 'Balcony', 'Балкон', 9),
('amenity', 'security', '24h Security', 'Охрана 24ч', 10),
('amenity', 'pet-friendly', 'Pet Friendly', 'Можно с питомцами', 11),
('amenity', 'beach-access', 'Beach Access', 'Выход к пляжу', 12);

-- Property types
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, sort_order) VALUES
('property_type', 'apartment', 'Apartment', 'Квартира', 1),
('property_type', 'villa', 'Villa', 'Вилла', 2),
('property_type', 'condo', 'Condo', 'Кондо', 3),
('property_type', 'house', 'House', 'Дом', 4),
('property_type', 'penthouse', 'Penthouse', 'Пентхаус', 5),
('property_type', 'studio', 'Studio', 'Студия', 6),
('property_type', 'townhouse', 'Townhouse', 'Таунхаус', 7);

-- Yacht types
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, sort_order) VALUES
('yacht_type', 'catamaran', 'Catamaran', 'Катамаран', 1),
('yacht_type', 'speedboat', 'Speedboat', 'Скоростной катер', 2),
('yacht_type', 'sailing', 'Sailing Yacht', 'Парусная яхта', 3),
('yacht_type', 'motor-yacht', 'Motor Yacht', 'Моторная яхта', 4),
('yacht_type', 'luxury-yacht', 'Luxury Yacht', 'Люксовая яхта', 5),
('yacht_type', 'fishing-boat', 'Fishing Boat', 'Рыболовное судно', 6);

-- Event categories
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, sort_order) VALUES
('event_category', 'concert', 'Concert', 'Концерт', 1),
('event_category', 'party', 'Party', 'Вечеринка', 2),
('event_category', 'festival', 'Festival', 'Фестиваль', 3),
('event_category', 'sports', 'Sports', 'Спорт', 4),
('event_category', 'exhibition', 'Exhibition', 'Выставка', 5),
('event_category', 'workshop', 'Workshop', 'Мастер-класс', 6),
('event_category', 'networking', 'Networking', 'Нетворкинг', 7);
-- Migration: 20260120022209_6ad24f23-effb-4245-a844-9805888c3cdd.sql
-- Update Water Sports naming in categories
UPDATE public.categories 
SET name_en = 'Water Sports', name_ru = 'Водный спорт'
WHERE slug = 'water';

-- Update Water Sports naming in category_groups
UPDATE public.category_groups 
SET name_en = 'Water Sports', name_ru = 'Водный спорт'
WHERE slug = 'water';
-- Migration: 20260120024413_92be219d-f33b-4f21-8539-a1ac8ff36755.sql
-- Add new marker columns for events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS is_global boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_last_minute boolean DEFAULT false;

-- Update some events with new markers
UPDATE public.events SET is_global = true WHERE title_en ILIKE '%festival%' OR title_en ILIKE '%jazz%';
UPDATE public.events SET is_recurring = true WHERE title_en ILIKE '%club%' OR title_en ILIKE '%saturday%';
UPDATE public.events SET is_last_minute = true WHERE spots_left < 20;
-- Migration: 20260120024838_ddea0c7b-4e3a-45a8-bac5-e3a90a3a075f.sql
-- Create venues table for event locations
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  venue_type TEXT NOT NULL DEFAULT 'club',
  capacity INTEGER,
  address TEXT,
  address_ru TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  email TEXT,
  website TEXT,
  opening_hours JSONB,
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  amenities JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add venue_id to events table
ALTER TABLE public.events ADD COLUMN venue_id UUID REFERENCES public.venues(id);

-- Enable RLS
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Public read access for venues
CREATE POLICY "Venues are viewable by everyone" 
ON public.venues FOR SELECT 
USING (is_active = true);

-- Admin/vendor can manage venues
CREATE POLICY "Admins can manage venues" 
ON public.venues FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'vendor')
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_venues_updated_at
BEFORE UPDATE ON public.venues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Insert demo venues
INSERT INTO public.venues (name_en, name_ru, venue_type, capacity, address, address_ru, lat, lng, phone, cover_image, amenities, is_featured, description_en, description_ru) VALUES
('LOTUS Arena', 'LOTUS Арена', 'arena', 5000, '118/5 Moo 4, Cherngtalay, Thalang, Phuket', '118/5 Му 4, Черногталай, Таланг, Пхукет', 7.9878, 98.3048, '+66 76 123 456', 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800', '["parking", "vip_lounge", "bar", "restaurant", "wheelchair_access"]', true, 'The largest concert arena in Phuket. World-class sound and lighting systems.', 'Крупнейшая концертная арена на Пхукете. Звук и свет мирового класса.'),
('Bangla Boxing Stadium', 'Стадион Бангла Бокс', 'stadium', 2000, 'Bangla Road, Patong, Phuket', 'Бангла Роуд, Патонг, Пхукет', 7.8952, 98.2971, '+66 76 345 678', 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800', '["parking", "bar", "betting_zone", "vip_ringside"]', true, 'Authentic Muay Thai stadium with fights every night.', 'Аутентичный стадион муай-тай с боями каждый вечер.'),
('Illuzion Club', 'Клуб Illuzion', 'club', 3000, '31 Bangla Road, Patong, Phuket', '31 Бангла Роуд, Патонг, Пхукет', 7.8945, 98.2965, '+66 76 567 890', 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800', '["vip_tables", "dance_floor", "bars", "smoking_area", "coat_check"]', true, 'The biggest nightclub in Southeast Asia with world-class DJs.', 'Крупнейший ночной клуб в Юго-Восточной Азии с мировыми диджеями.'),
('Café del Mar', 'Кафе дель Мар', 'beach_club', 800, 'Kamala Beach, Phuket', 'Пляж Камала, Пхукет', 7.9512, 98.2803, '+66 76 234 567', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', '["pool", "beach_access", "restaurant", "bar", "sunset_view", "dj_booth"]', true, 'Iconic beach club with legendary sunset sessions.', 'Легендарный пляжный клуб с фирменными закатными сетами.'),
('Simon Cabaret', 'Симон Кабаре', 'theater', 600, '8 Sirirach Rd, Patong, Phuket', '8 Сирирач Роуд, Патонг, Пхукет', 7.8899, 98.3012, '+66 76 342 114', 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800', '["air_conditioning", "gift_shop", "photo_zone", "bar"]', true, 'World-famous cabaret show with spectacular costumes.', 'Всемирно известное кабаре-шоу с потрясающими костюмами.'),
('Paradise Beach Club', 'Парадайз Бич Клуб', 'outdoor', 2500, 'Paradise Beach, Patong, Phuket', 'Пляж Парадайз, Патонг, Пхукет', 7.8734, 98.2756, '+66 76 456 789', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', '["beach_access", "pool", "multiple_bars", "dance_floor", "food_stalls", "boat_transfer"]', true, 'Epic beach parties with international headliners.', 'Эпические пляжные вечеринки с мировыми хедлайнерами.');

-- Link some existing events to venues (example)
UPDATE public.events SET venue_id = (SELECT id FROM public.venues WHERE name_en = 'Illuzion Club' LIMIT 1) WHERE category = 'club' AND venue_id IS NULL;
UPDATE public.events SET venue_id = (SELECT id FROM public.venues WHERE name_en = 'Café del Mar' LIMIT 1) WHERE category = 'sunset' AND venue_id IS NULL;
UPDATE public.events SET venue_id = (SELECT id FROM public.venues WHERE name_en = 'Paradise Beach Club' LIMIT 1) WHERE category = 'beach-party' AND venue_id IS NULL;
-- Migration: 20260120034300_bd9c3557-18ac-4a87-bfbf-ca90324dcc50.sql
-- =============================================
-- 1. USER DOCUMENTS TABLE (passport, driver license, insurance)
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('passport', 'driver_license', 'insurance', 'visa', 'other')),
  document_number TEXT,
  country TEXT,
  issue_date DATE,
  expiry_date DATE,
  file_url TEXT,
  file_name TEXT,
  notes TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, document_type)
);

-- Enable RLS
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access their own documents
CREATE POLICY "Users can view own documents" ON public.user_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON public.user_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.user_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.user_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_user_documents_updated_at ON public.user_documents;
CREATE TRIGGER update_user_documents_updated_at
  BEFORE UPDATE ON public.user_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 2. EXTENDED PROFILE DETAILS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.profile_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Personal info
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  nationality TEXT,
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country TEXT,
  
  -- Emergency contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  
  -- Additional preferences
  dietary_restrictions TEXT[],
  medical_conditions TEXT,
  travel_preferences JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_details ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can view own profile details" ON public.profile_details;
CREATE POLICY "Users can view own profile details" ON public.profile_details
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile details" ON public.profile_details;
CREATE POLICY "Users can insert own profile details" ON public.profile_details
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile details" ON public.profile_details;
CREATE POLICY "Users can update own profile details" ON public.profile_details
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_profile_details_updated_at ON public.profile_details;
CREATE TRIGGER update_profile_details_updated_at
  BEFORE UPDATE ON public.profile_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 3. STORAGE BUCKET FOR USER DOCUMENTS
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('user-documents', 'user-documents', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Storage policies - users can only access their own folder
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can view own documents storage" ON storage.objects;
CREATE POLICY "Users can view own documents storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update own documents storage" ON storage.objects;
CREATE POLICY "Users can update own documents storage"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own documents storage" ON storage.objects;
CREATE POLICY "Users can delete own documents storage"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- Migration: 20260120035141_02078cde-d581-429c-9be4-360e6e12f44a.sql
-- Extend platform_metrics with M&A critical fields
ALTER TABLE public.platform_metrics
ADD COLUMN IF NOT EXISTS avg_order_value NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS repeat_purchase_rate NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cross_sell_rate NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dau INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mau INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_session_duration_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS d7_retention NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS d30_retention NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS property_listings_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS property_occupancy_rate NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS property_adr NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS property_gmv NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tours_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tours_gmv NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tours_avg_rating NUMERIC(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS yachts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS yachts_gmv NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_take_rate NUMERIC(5,2) DEFAULT 10,
ADD COLUMN IF NOT EXISTS gross_margin NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ltv NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cac NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ltv_cac_ratio NUMERIC(5,2) DEFAULT 0;

-- Create cohort_metrics table for retention analysis
CREATE TABLE IF NOT EXISTS public.cohort_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_date DATE NOT NULL,
  cohort_size INTEGER NOT NULL DEFAULT 0,
  d1_retained INTEGER DEFAULT 0,
  d7_retained INTEGER DEFAULT 0,
  d30_retained INTEGER DEFAULT 0,
  d90_retained INTEGER DEFAULT 0,
  d1_retention_rate NUMERIC(5,2) DEFAULT 0,
  d7_retention_rate NUMERIC(5,2) DEFAULT 0,
  d30_retention_rate NUMERIC(5,2) DEFAULT 0,
  d90_retention_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cohort_date)
);

-- Create vertical_metrics table for per-vertical analytics
CREATE TABLE IF NOT EXISTS public.vertical_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  vertical VARCHAR(50) NOT NULL,
  listings_count INTEGER DEFAULT 0,
  active_listings INTEGER DEFAULT 0,
  providers_count INTEGER DEFAULT 0,
  bookings_count INTEGER DEFAULT 0,
  gmv NUMERIC(12,2) DEFAULT 0,
  avg_order_value NUMERIC(12,2) DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  take_rate NUMERIC(5,2) DEFAULT 10,
  revenue NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, vertical)
);

-- Create geographic_metrics table for location-based analytics
CREATE TABLE IF NOT EXISTS public.geographic_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  location_name VARCHAR(100) NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  users_count INTEGER DEFAULT 0,
  providers_count INTEGER DEFAULT 0,
  bookings_count INTEGER DEFAULT 0,
  gmv NUMERIC(12,2) DEFAULT 0,
  avg_order_value NUMERIC(12,2) DEFAULT 0,
  top_vertical VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, location_name)
);

-- Create cross_sell_metrics table for tracking multi-vertical usage
CREATE TABLE IF NOT EXISTS public.cross_sell_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  from_vertical VARCHAR(50) NOT NULL,
  to_vertical VARCHAR(50) NOT NULL,
  users_count INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, from_vertical, to_vertical)
);

-- Enable RLS on new tables
ALTER TABLE public.cohort_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vertical_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geographic_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_sell_metrics ENABLE ROW LEVEL SECURITY;

-- Admin-only read policies
CREATE POLICY "Admins can read cohort_metrics"
  ON public.cohort_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read vertical_metrics"
  ON public.vertical_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read geographic_metrics"
  ON public.geographic_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read cross_sell_metrics"
  ON public.cross_sell_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cohort_metrics_date ON public.cohort_metrics(cohort_date);
CREATE INDEX IF NOT EXISTS idx_vertical_metrics_date ON public.vertical_metrics(date);
CREATE INDEX IF NOT EXISTS idx_vertical_metrics_vertical ON public.vertical_metrics(vertical);
CREATE INDEX IF NOT EXISTS idx_geographic_metrics_date ON public.geographic_metrics(date);
CREATE INDEX IF NOT EXISTS idx_cross_sell_metrics_date ON public.cross_sell_metrics(date);
-- Migration: 20260120062946_35e7f5c2-031b-4843-b9a9-7d45f55d0035.sql
-- Drop the recursive policy causing infinite recursion error
DROP POLICY IF EXISTS "Org owners can manage members" ON public.org_members;

-- Create a non-recursive policy using security definer function
CREATE OR REPLACE FUNCTION public.is_org_owner(check_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = check_org_id
      AND user_id = auth.uid()
      AND role = 'owner'
      AND is_active = true
  );
$$;

-- Recreate policy using the security definer function (avoids recursion)
CREATE POLICY "Org owners can manage members"
ON public.org_members
FOR ALL
USING (
  user_id = auth.uid() OR is_org_owner(org_id)
)
WITH CHECK (
  is_org_owner(org_id)
);
-- Migration: 20260120134000_f2757499-e275-4251-8ecb-f838732ca769.sql
-- Support tickets table for disputes and complaints
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  
  -- Relations
  user_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  booking_id UUID,
  property_id UUID,
  provider_id UUID REFERENCES providers(id),
  
  -- Reporter info
  reporter_type TEXT NOT NULL CHECK (reporter_type IN ('guest', 'owner', 'vendor', 'anonymous')),
  reporter_name TEXT,
  reporter_email TEXT,
  reporter_phone TEXT,
  
  -- Ticket details
  category TEXT NOT NULL CHECK (category IN ('refund', 'quality', 'fraud', 'damage', 'payment', 'delivery', 'cancellation', 'other')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Status and SLA
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed', 'escalated')),
  assigned_to UUID REFERENCES auth.users(id),
  sla_deadline TIMESTAMPTZ,
  
  -- Resolution
  resolution TEXT,
  resolution_type TEXT CHECK (resolution_type IN ('refund_full', 'refund_partial', 'no_refund', 'compensation', 'mediation', 'rejected')),
  refund_amount NUMERIC(12,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- Ticket messages for conversation history
CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
  sender_name TEXT,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_sla_deadline ON support_tickets(sla_deadline);
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets"
ON support_tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
ON support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own tickets"
ON support_tickets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
ON support_tickets FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all tickets"
ON support_tickets FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ticket_messages
CREATE POLICY "Users can view messages of their tickets"
ON ticket_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE id = ticket_messages.ticket_id 
    AND user_id = auth.uid()
  ) AND is_internal = false
);

CREATE POLICY "Users can add messages to their tickets"
ON ticket_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE id = ticket_messages.ticket_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all messages"
ON ticket_messages FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can add messages to any ticket"
ON ticket_messages FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(ticket_number FROM 'TKT-\d{4}-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM support_tickets
  WHERE ticket_number LIKE 'TKT-' || year_part || '-%';
  
  NEW.ticket_number := 'TKT-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
  
  RETURN NEW;
END;
$$;

-- Trigger for ticket number generation
CREATE TRIGGER trigger_generate_ticket_number
BEFORE INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_number();

-- Function to set SLA deadline based on priority
CREATE OR REPLACE FUNCTION public.set_ticket_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.sla_deadline IS NULL THEN
    NEW.sla_deadline := CASE NEW.priority
      WHEN 'urgent' THEN NOW() + INTERVAL '4 hours'
      WHEN 'high' THEN NOW() + INTERVAL '12 hours'
      WHEN 'normal' THEN NOW() + INTERVAL '24 hours'
      WHEN 'low' THEN NOW() + INTERVAL '48 hours'
      ELSE NOW() + INTERVAL '24 hours'
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for SLA
CREATE TRIGGER trigger_set_ticket_sla
BEFORE INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION set_ticket_sla();

-- Update timestamp trigger
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Enable realtime for tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
-- Migration: 20260120142115_44382353-d80d-4d03-9968-e2588db1c5e5.sql
-- Add sender_name column to ticket_messages if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'ticket_messages' 
                 AND column_name = 'sender_name') THEN
    ALTER TABLE public.ticket_messages ADD COLUMN sender_name TEXT;
  END IF;
END $$;

-- Drop existing INSERT policies for ticket_messages and recreate with proper checks
DROP POLICY IF EXISTS "Users can add messages to their tickets" ON public.ticket_messages;
DROP POLICY IF EXISTS "Admins can add messages to any ticket" ON public.ticket_messages;
DROP POLICY IF EXISTS "System can add messages" ON public.ticket_messages;

-- Users can only add messages to their own tickets
CREATE POLICY "Users can add messages to their tickets"
  ON public.ticket_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
    AND sender_type = 'user'
    AND is_internal = false
  );

-- Admins can add messages to any ticket (including internal notes and system messages)
CREATE POLICY "Admins can add messages to any ticket"
  ON public.ticket_messages
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
  );

-- System messages (like from triggers) - allow sender_id to be null for system messages
CREATE POLICY "System can add messages"
  ON public.ticket_messages
  FOR INSERT
  WITH CHECK (
    sender_type = 'system' AND sender_id IS NULL
  );
-- Migration: 20260120145400_69d99cb0-fd8b-4614-be1d-0d1c96d0b96b.sql
-- Create consultation_requests table for all types of consultation/management requests
CREATE TABLE public.consultation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Request type
  request_type TEXT NOT NULL CHECK (request_type IN (
    'property_consultation',
    'property_tour',
    'full_management',
    'investment_advice'
  )),
  
  -- Contact information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  preferred_language TEXT DEFAULT 'en',
  preferred_contact_method TEXT DEFAULT 'whatsapp',
  
  -- Request details
  budget_min NUMERIC,
  budget_max NUMERIC,
  currency TEXT DEFAULT 'THB',
  property_types TEXT[],
  districts TEXT[],
  bedrooms_min INTEGER,
  bedrooms_max INTEGER,
  purpose TEXT,
  
  -- For tours
  preferred_dates JSONB,
  property_ids UUID[],
  
  -- For full management
  owner_property_id UUID,
  services_requested TEXT[],
  current_occupancy TEXT,
  
  -- Status and processing
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'contacted', 'scheduled', 'in_progress', 'completed', 'cancelled'
  )),
  priority TEXT DEFAULT 'normal',
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT,
  admin_notes TEXT,
  
  -- Outcome
  outcome TEXT,
  follow_up_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own consultation requests"
  ON public.consultation_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own requests
CREATE POLICY "Users can create consultation requests"
  ON public.consultation_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own pending requests
CREATE POLICY "Users can update own pending requests"
  ON public.consultation_requests FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Anonymous users can also submit requests (for non-logged-in users)
CREATE POLICY "Anonymous users can create requests"
  ON public.consultation_requests FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Create updated_at trigger
CREATE TRIGGER update_consultation_requests_updated_at
  BEFORE UPDATE ON public.consultation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_consultation_requests_user_id ON public.consultation_requests(user_id);
CREATE INDEX idx_consultation_requests_status ON public.consultation_requests(status);
CREATE INDEX idx_consultation_requests_type ON public.consultation_requests(request_type);
-- Migration: 20260121005921_72bc979a-2bc7-41f9-90f8-dc839e62bf08.sql
-- Add approval_status and related columns to all service tables that don't have them

-- Tours
ALTER TABLE tours ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE tours ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Water Activities
ALTER TABLE water_activities ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE water_activities ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE water_activities ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE water_activities ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Salons
ALTER TABLE salons ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Clinics
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Gyms
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Pharmacies
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Insurance Providers
ALTER TABLE insurance_providers ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE insurance_providers ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE insurance_providers ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE insurance_providers ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Babysitters
ALTER TABLE babysitters ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE babysitters ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE babysitters ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE babysitters ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Cleaning Services
ALTER TABLE cleaning_services ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE cleaning_services ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE cleaning_services ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE cleaning_services ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Legal Services
ALTER TABLE legal_services ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE legal_services ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE legal_services ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE legal_services ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Pet Services
ALTER TABLE pet_services ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE pet_services ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE pet_services ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE pet_services ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Education Providers
ALTER TABLE education_providers ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE education_providers ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE education_providers ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE education_providers ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Events
ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE events ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Yachts (check if exists, add if not)
ALTER TABLE yachts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE yachts ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE yachts ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Flower Shops (check if exists, add if not)
ALTER TABLE flower_shops ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE flower_shops ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE flower_shops ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Stores (check if exists, add if not)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Create indexes for approval_status queries
CREATE INDEX IF NOT EXISTS idx_tours_approval_status ON tours(approval_status);
CREATE INDEX IF NOT EXISTS idx_water_activities_approval_status ON water_activities(approval_status);
CREATE INDEX IF NOT EXISTS idx_restaurants_approval_status ON restaurants(approval_status);
CREATE INDEX IF NOT EXISTS idx_salons_approval_status ON salons(approval_status);
CREATE INDEX IF NOT EXISTS idx_clinics_approval_status ON clinics(approval_status);
CREATE INDEX IF NOT EXISTS idx_gyms_approval_status ON gyms(approval_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_approval_status ON vehicles(approval_status);
CREATE INDEX IF NOT EXISTS idx_properties_approval_status ON properties(approval_status);
CREATE INDEX IF NOT EXISTS idx_pharmacies_approval_status ON pharmacies(approval_status);
CREATE INDEX IF NOT EXISTS idx_insurance_providers_approval_status ON insurance_providers(approval_status);
CREATE INDEX IF NOT EXISTS idx_babysitters_approval_status ON babysitters(approval_status);
CREATE INDEX IF NOT EXISTS idx_cleaning_services_approval_status ON cleaning_services(approval_status);
CREATE INDEX IF NOT EXISTS idx_legal_services_approval_status ON legal_services(approval_status);
CREATE INDEX IF NOT EXISTS idx_pet_services_approval_status ON pet_services(approval_status);
CREATE INDEX IF NOT EXISTS idx_education_providers_approval_status ON education_providers(approval_status);
CREATE INDEX IF NOT EXISTS idx_events_approval_status ON events(approval_status);
CREATE INDEX IF NOT EXISTS idx_yachts_approval_status ON yachts(approval_status);
CREATE INDEX IF NOT EXISTS idx_flower_shops_approval_status ON flower_shops(approval_status);
CREATE INDEX IF NOT EXISTS idx_stores_approval_status ON stores(approval_status);
-- Migration: 20260121010005_982a783a-0ff3-49fc-bd4a-230f9365dbd8.sql
-- Update existing records to have approved status (since they were created before moderation system)
UPDATE tours SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE water_activities SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE restaurants SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE salons SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE clinics SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE gyms SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE vehicles SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE properties SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE pharmacies SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE insurance_providers SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE babysitters SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE cleaning_services SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE legal_services SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE pet_services SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE education_providers SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE events SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE yachts SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE flower_shops SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE stores SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;

-- Create function for vendor content status notifications
CREATE OR REPLACE FUNCTION notify_vendor_on_content_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_provider_user_id UUID;
  v_item_name TEXT;
  v_title_en TEXT;
  v_title_ru TEXT;
  v_body_en TEXT;
  v_body_ru TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.approval_status IS NOT DISTINCT FROM NEW.approval_status THEN
    RETURN NEW;
  END IF;
  
  -- Get provider's user_id
  SELECT user_id INTO v_provider_user_id
  FROM providers
  WHERE id = NEW.provider_id;
  
  -- Skip if no provider found
  IF v_provider_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get item name (try different column naming conventions)
  v_item_name := COALESCE(
    NEW.title_en,
    NEW.name_en,
    'Your item'
  );
  
  -- Set notification content based on status
  IF NEW.approval_status = 'approved' THEN
    v_title_en := '✅ Content Approved!';
    v_title_ru := '✅ Контент одобрен!';
    v_body_en := '"' || v_item_name || '" is now visible to users';
    v_body_ru := '"' || v_item_name || '" теперь виден пользователям';
  ELSIF NEW.approval_status = 'rejected' THEN
    v_title_en := '❌ Content Rejected';
    v_title_ru := '❌ Контент отклонён';
    v_body_en := '"' || v_item_name || '" was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'Not specified');
    v_body_ru := '"' || v_item_name || '" отклонён. Причина: ' || COALESCE(NEW.rejection_reason, 'Не указана');
  ELSE
    RETURN NEW;
  END IF;
  
  -- Insert notification
  INSERT INTO notifications (
    user_id,
    title,
    body,
    type,
    data,
    is_read
  ) VALUES (
    v_provider_user_id,
    v_title_ru,
    v_body_ru,
    'content_moderation',
    jsonb_build_object(
      'item_id', NEW.id,
      'item_type', TG_TABLE_NAME,
      'new_status', NEW.approval_status,
      'rejection_reason', NEW.rejection_reason
    ),
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for all content tables
DROP TRIGGER IF EXISTS trigger_notify_vendor_tours ON tours;
CREATE TRIGGER trigger_notify_vendor_tours
  AFTER UPDATE OF approval_status ON tours
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_water_activities ON water_activities;
CREATE TRIGGER trigger_notify_vendor_water_activities
  AFTER UPDATE OF approval_status ON water_activities
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_restaurants ON restaurants;
CREATE TRIGGER trigger_notify_vendor_restaurants
  AFTER UPDATE OF approval_status ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_salons ON salons;
CREATE TRIGGER trigger_notify_vendor_salons
  AFTER UPDATE OF approval_status ON salons
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_clinics ON clinics;
CREATE TRIGGER trigger_notify_vendor_clinics
  AFTER UPDATE OF approval_status ON clinics
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_gyms ON gyms;
CREATE TRIGGER trigger_notify_vendor_gyms
  AFTER UPDATE OF approval_status ON gyms
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_vehicles ON vehicles;
CREATE TRIGGER trigger_notify_vendor_vehicles
  AFTER UPDATE OF approval_status ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_properties ON properties;
CREATE TRIGGER trigger_notify_vendor_properties
  AFTER UPDATE OF approval_status ON properties
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_yachts ON yachts;
CREATE TRIGGER trigger_notify_vendor_yachts
  AFTER UPDATE OF approval_status ON yachts
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_events ON events;
CREATE TRIGGER trigger_notify_vendor_events
  AFTER UPDATE OF approval_status ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_babysitters ON babysitters;
CREATE TRIGGER trigger_notify_vendor_babysitters
  AFTER UPDATE OF approval_status ON babysitters
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_cleaning_services ON cleaning_services;
CREATE TRIGGER trigger_notify_vendor_cleaning_services
  AFTER UPDATE OF approval_status ON cleaning_services
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_legal_services ON legal_services;
CREATE TRIGGER trigger_notify_vendor_legal_services
  AFTER UPDATE OF approval_status ON legal_services
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_pet_services ON pet_services;
CREATE TRIGGER trigger_notify_vendor_pet_services
  AFTER UPDATE OF approval_status ON pet_services
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_education_providers ON education_providers;
CREATE TRIGGER trigger_notify_vendor_education_providers
  AFTER UPDATE OF approval_status ON education_providers
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_pharmacies ON pharmacies;
CREATE TRIGGER trigger_notify_vendor_pharmacies
  AFTER UPDATE OF approval_status ON pharmacies
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_insurance_providers ON insurance_providers;
CREATE TRIGGER trigger_notify_vendor_insurance_providers
  AFTER UPDATE OF approval_status ON insurance_providers
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_flower_shops ON flower_shops;
CREATE TRIGGER trigger_notify_vendor_flower_shops
  AFTER UPDATE OF approval_status ON flower_shops
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_stores ON stores;
CREATE TRIGGER trigger_notify_vendor_stores
  AFTER UPDATE OF approval_status ON stores
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();
-- Migration: 20260121011023_7e3264c9-ee98-4884-9bde-f85cd26f0cfa.sql
-- First add approval_status to services table if it doesn't exist
ALTER TABLE services ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE services ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE services ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Fix RLS policies for all content tables to only show approved content to public users
-- Vendors can still see their own content regardless of status

-- 1. TOURS
DROP POLICY IF EXISTS "Anyone can view active tours" ON tours;
CREATE POLICY "Anyone can view approved tours or own content" ON tours
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = tours.provider_id AND user_id = auth.uid())
  );

-- 2. WATER_ACTIVITIES
DROP POLICY IF EXISTS "Anyone can view active water activities" ON water_activities;
CREATE POLICY "Anyone can view approved water activities or own content" ON water_activities
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = water_activities.provider_id AND user_id = auth.uid())
  );

-- 3. RESTAURANTS
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON restaurants;
CREATE POLICY "Anyone can view approved restaurants or own content" ON restaurants
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = restaurants.provider_id AND user_id = auth.uid())
  );

-- 4. SALONS
DROP POLICY IF EXISTS "Anyone can view salons" ON salons;
CREATE POLICY "Anyone can view approved salons or own content" ON salons
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = salons.provider_id AND user_id = auth.uid())
  );

-- 5. CLINICS
DROP POLICY IF EXISTS "Anyone can view active clinics" ON clinics;
CREATE POLICY "Anyone can view approved clinics or own content" ON clinics
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = clinics.provider_id AND user_id = auth.uid())
  );

-- 6. GYMS
DROP POLICY IF EXISTS "Anyone can view gyms" ON gyms;
CREATE POLICY "Anyone can view approved gyms or own content" ON gyms
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = gyms.provider_id AND user_id = auth.uid())
  );

-- 7. VEHICLES
DROP POLICY IF EXISTS "Anyone can view vehicles" ON vehicles;
CREATE POLICY "Anyone can view approved vehicles or own content" ON vehicles
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = vehicles.provider_id AND user_id = auth.uid())
  );

-- 8. PROPERTIES
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
CREATE POLICY "Anyone can view approved properties or own content" ON properties
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = properties.provider_id AND user_id = auth.uid())
  );

-- 9. PHARMACIES
DROP POLICY IF EXISTS "Anyone can view active pharmacies" ON pharmacies;
CREATE POLICY "Anyone can view approved pharmacies or own content" ON pharmacies
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = pharmacies.provider_id AND user_id = auth.uid())
  );

-- 10. BABYSITTERS
DROP POLICY IF EXISTS "Anyone can view babysitters" ON babysitters;
CREATE POLICY "Anyone can view approved babysitters or own content" ON babysitters
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = babysitters.provider_id AND user_id = auth.uid())
  );

-- 11. CLEANING_SERVICES
DROP POLICY IF EXISTS "Anyone can view cleaning services" ON cleaning_services;
CREATE POLICY "Anyone can view approved cleaning services or own content" ON cleaning_services
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = cleaning_services.provider_id AND user_id = auth.uid())
  );

-- 12. LEGAL_SERVICES
DROP POLICY IF EXISTS "Anyone can view legal services" ON legal_services;
CREATE POLICY "Anyone can view approved legal services or own content" ON legal_services
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = legal_services.provider_id AND user_id = auth.uid())
  );

-- 13. PET_SERVICES
DROP POLICY IF EXISTS "Anyone can view pet services" ON pet_services;
CREATE POLICY "Anyone can view approved pet services or own content" ON pet_services
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = pet_services.provider_id AND user_id = auth.uid())
  );

-- 14. EDUCATION_PROVIDERS
DROP POLICY IF EXISTS "Anyone can view education providers" ON education_providers;
CREATE POLICY "Anyone can view approved education providers or own content" ON education_providers
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = education_providers.provider_id AND user_id = auth.uid())
  );

-- 15. EVENTS
DROP POLICY IF EXISTS "Anyone can view active events" ON events;
CREATE POLICY "Anyone can view approved events or own content" ON events
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = events.provider_id AND user_id = auth.uid())
  );

-- 16. INSURANCE_PROVIDERS
DROP POLICY IF EXISTS "Anyone can view insurance providers" ON insurance_providers;
CREATE POLICY "Anyone can view approved insurance providers or own content" ON insurance_providers
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = insurance_providers.provider_id AND user_id = auth.uid())
  );

-- 17. SERVICES (general services table)
DROP POLICY IF EXISTS "Anyone can view active services" ON services;
CREATE POLICY "Anyone can view approved services or own content" ON services
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = services.provider_id AND user_id = auth.uid())
  );
-- Migration: 20260121012045_42561c0d-f266-435e-8cf1-7bf077bfe2d9.sql
-- Create quick_listings table for simplified submissions
CREATE TABLE public.quick_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  category TEXT NOT NULL, -- property, service, product, experience
  subcategory TEXT, -- tour, yacht, restaurant, villa, etc.
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2),
  currency TEXT DEFAULT 'THB',
  images TEXT[],
  location TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
  converted_to_type TEXT, -- tours, yachts, properties, etc.
  converted_to_id UUID,
  admin_notes TEXT,
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quick_listings ENABLE ROW LEVEL SECURITY;

-- Users can view their own listings
CREATE POLICY "Users can view own quick listings"
  ON public.quick_listings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create quick listings
CREATE POLICY "Users can create quick listings"
  ON public.quick_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own pending listings
CREATE POLICY "Users can update own pending listings"
  ON public.quick_listings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all listings
CREATE POLICY "Admins can view all quick listings"
  ON public.quick_listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any listing
CREATE POLICY "Admins can update any quick listing"
  ON public.quick_listings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX idx_quick_listings_status ON public.quick_listings(status);
CREATE INDEX idx_quick_listings_user_id ON public.quick_listings(user_id);
CREATE INDEX idx_quick_listings_category ON public.quick_listings(category);

-- Trigger for updated_at
CREATE TRIGGER update_quick_listings_updated_at
  BEFORE UPDATE ON public.quick_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260121020025_e9d261c1-e932-4cc0-a365-6bc33d2a53e9.sql
-- Add rooms JSONB field to owner_properties for detailed room configuration
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS rooms JSONB DEFAULT '[]'::jsonb;

-- Add highlights array for property features
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}';

-- Add nearby_places JSONB for points of interest
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS nearby_places JSONB DEFAULT '[]'::jsonb;

-- Add safety_features array
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS safety_features TEXT[] DEFAULT '{}';

-- Add accessibility_features array
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS accessibility_features TEXT[] DEFAULT '{}';

-- Create property_availability table for calendar management
CREATE TABLE IF NOT EXISTS property_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES owner_properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'blocked', 'booked')),
  price_override DECIMAL(10,2),
  min_nights_override INTEGER,
  note TEXT,
  booking_id UUID REFERENCES property_bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(property_id, date)
);

-- Enable RLS on property_availability
ALTER TABLE property_availability ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can view their property availability
CREATE POLICY "Owners can view own property availability"
ON property_availability
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM owner_properties op
    WHERE op.id = property_availability.property_id
    AND op.owner_id = auth.uid()
  )
);

-- Policy: Owners can insert availability for their properties
CREATE POLICY "Owners can insert own property availability"
ON property_availability
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM owner_properties op
    WHERE op.id = property_availability.property_id
    AND op.owner_id = auth.uid()
  )
);

-- Policy: Owners can update their property availability
CREATE POLICY "Owners can update own property availability"
ON property_availability
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM owner_properties op
    WHERE op.id = property_availability.property_id
    AND op.owner_id = auth.uid()
  )
);

-- Policy: Owners can delete their property availability
CREATE POLICY "Owners can delete own property availability"
ON property_availability
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM owner_properties op
    WHERE op.id = property_availability.property_id
    AND op.owner_id = auth.uid()
  )
);

-- Policy: Admins can manage all availability (using has_role function)
CREATE POLICY "Admins can manage all availability"
ON property_availability
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Policy: Public can view availability for active properties (for booking calendar)
CREATE POLICY "Public can view availability for active properties"
ON property_availability
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM owner_properties op
    JOIN properties mp ON mp.id = op.marketplace_property_id
    WHERE op.id = property_availability.property_id
    AND mp.is_active = true
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_property_availability_property_date 
ON property_availability(property_id, date);

CREATE INDEX IF NOT EXISTS idx_property_availability_status 
ON property_availability(status);

-- Add trigger for updated_at
CREATE TRIGGER update_property_availability_updated_at
BEFORE UPDATE ON property_availability
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- Migration: 20260121022845_ed8d1bce-13fd-42d6-a4d6-e99340a0c7e6.sql
-- Add RLS policy for admins to view and manage all consultation requests
CREATE POLICY "Admins can view all consultation requests"
  ON public.consultation_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all consultation requests"
  ON public.consultation_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Add vacation_rental to the request_type check constraint
ALTER TABLE public.consultation_requests 
DROP CONSTRAINT IF EXISTS consultation_requests_request_type_check;

ALTER TABLE public.consultation_requests 
ADD CONSTRAINT consultation_requests_request_type_check 
CHECK (request_type IN (
  'vacation_rental',
  'property_consultation',
  'property_tour',
  'full_management',
  'investment_advice'
));

-- Add guests_count and children_count columns for vacation rentals
ALTER TABLE public.consultation_requests 
ADD COLUMN IF NOT EXISTS guests_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS children_count INTEGER DEFAULT 0;
-- Migration: 20260121023608_d015fef1-5ea4-46f3-b9a3-c892fa321b2f.sql
-- Add uno_team to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'uno_team';
-- Migration: 20260121023628_1c76795a-d650-4582-b940-295279757b2c.sql
-- Add lead management fields to consultation_requests
ALTER TABLE public.consultation_requests 
  ADD COLUMN IF NOT EXISTS lead_source text DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS sla_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS first_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS contact_attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversion_order_id uuid REFERENCES public.orders(id);

-- Create function to calculate SLA deadline based on request type
CREATE OR REPLACE FUNCTION public.calculate_sla_deadline(request_type text, created_at timestamptz)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE request_type
    WHEN 'vacation_rental' THEN created_at + interval '2 hours'
    WHEN 'property_tour' THEN created_at + interval '4 hours'
    WHEN 'property_consultation' THEN created_at + interval '24 hours'
    WHEN 'investment_advice' THEN created_at + interval '48 hours'
    WHEN 'full_management' THEN created_at + interval '24 hours'
    ELSE created_at + interval '24 hours'
  END;
END;
$$;

-- Trigger to auto-set SLA deadline on insert
CREATE OR REPLACE FUNCTION public.set_lead_sla_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.sla_deadline := public.calculate_sla_deadline(NEW.request_type, NEW.created_at);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_sla_deadline_trigger ON public.consultation_requests;
CREATE TRIGGER set_sla_deadline_trigger
  BEFORE INSERT ON public.consultation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_lead_sla_deadline();

-- Update existing records with SLA deadlines
UPDATE public.consultation_requests 
SET sla_deadline = public.calculate_sla_deadline(request_type, created_at)
WHERE sla_deadline IS NULL;

-- RLS policies for UNO Team
DROP POLICY IF EXISTS "uno_team_view_leads" ON public.consultation_requests;
CREATE POLICY "uno_team_view_leads" ON public.consultation_requests
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'uno_team') OR 
    public.has_role(auth.uid(), 'admin') OR
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "uno_team_update_leads" ON public.consultation_requests;
CREATE POLICY "uno_team_update_leads" ON public.consultation_requests
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'uno_team') OR 
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'uno_team') OR 
    public.has_role(auth.uid(), 'admin')
  );
-- Migration: 20260121023642_6c4204ee-1e5a-4051-8838-1283126602bc.sql
-- Fix function search path for calculate_sla_deadline
CREATE OR REPLACE FUNCTION public.calculate_sla_deadline(request_type text, created_at timestamptz)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN CASE request_type
    WHEN 'vacation_rental' THEN created_at + interval '2 hours'
    WHEN 'property_tour' THEN created_at + interval '4 hours'
    WHEN 'property_consultation' THEN created_at + interval '24 hours'
    WHEN 'investment_advice' THEN created_at + interval '48 hours'
    WHEN 'full_management' THEN created_at + interval '24 hours'
    ELSE created_at + interval '24 hours'
  END;
END;
$$;
-- Migration: 20260121024325_262c9f5a-ccad-4479-8bcc-cee22cc734ce.sql
-- Create UNO Team permissions table
CREATE TABLE IF NOT EXISTS public.uno_team_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vertical text NOT NULL,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_submit_for_review boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, vertical)
);

COMMENT ON TABLE public.uno_team_permissions IS 'Granular permissions for UNO Team members per vertical';

ALTER TABLE public.uno_team_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_permissions" ON public.uno_team_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "uno_team_view_own_permissions" ON public.uno_team_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'uno_team'));

CREATE TRIGGER update_uno_team_permissions_updated_at
  BEFORE UPDATE ON public.uno_team_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.uno_team_can(
  _user_id uuid,
  _vertical text,
  _action text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.uno_team_permissions
    WHERE user_id = _user_id
      AND vertical = _vertical
      AND CASE _action
        WHEN 'create' THEN can_create
        WHEN 'edit' THEN can_edit
        WHEN 'delete' THEN can_delete
        WHEN 'submit' THEN can_submit_for_review
        ELSE false
      END
  )
$$;
-- Migration: 20260121024345_38106d5d-85ba-4713-8b40-a1b31ec2ccee.sql
-- Add uno_team tracking columns to main content tables
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.yachts ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.yachts ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.water_activities ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.water_activities ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.cleaning_services ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.cleaning_services ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.babysitters ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.babysitters ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.education_providers ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.education_providers ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.flower_shops ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.flower_shops ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.pet_services ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.pet_services ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.insurance_providers ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.insurance_providers ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);
-- Migration: 20260121024837_895a24f1-d50e-4dcd-af64-fefa943237f4.sql
-- Create lead activity log table for tracking all interactions
CREATE TABLE public.lead_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.consultation_requests(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  activity_type text NOT NULL, -- 'call', 'email', 'whatsapp', 'note', 'status_change', 'assignment'
  status_from text,
  status_to text,
  notes text,
  call_duration_seconds integer,
  call_result text, -- 'answered', 'no_answer', 'busy', 'callback_requested', 'wrong_number'
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lead_activity_log IS 'Activity log for tracking all lead interactions';

-- Enable RLS
ALTER TABLE public.lead_activity_log ENABLE ROW LEVEL SECURITY;

-- Admins and UNO Team can view and create logs
CREATE POLICY "team_view_activity_logs" ON public.lead_activity_log
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'uno_team')
  );

CREATE POLICY "team_create_activity_logs" ON public.lead_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'uno_team')
  );

-- Create index for faster queries
CREATE INDEX idx_lead_activity_log_lead_id ON public.lead_activity_log(lead_id);
CREATE INDEX idx_lead_activity_log_created_at ON public.lead_activity_log(created_at DESC);
CREATE INDEX idx_lead_activity_log_user_id ON public.lead_activity_log(user_id);

-- Add outcome field to consultation_requests if not exists
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS outcome text; -- 'converted', 'lost', 'no_response', 'not_qualified'

-- Add follow_up_date for scheduling
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS follow_up_date timestamptz;

-- Add priority field
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal'; -- 'low', 'normal', 'high', 'urgent'
-- Migration: 20260121030419_3f1312a2-9218-46bc-a588-0a51f96a56ba.sql
-- Create vertical commission rules table
CREATE TABLE public.vertical_commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical TEXT NOT NULL UNIQUE,
  base_commission NUMERIC(5,2) NOT NULL DEFAULT 10,
  min_commission_amount NUMERIC(12,2),
  max_commission_amount NUMERIC(12,2),
  tiered_rates JSONB,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vertical_commission_rules ENABLE ROW LEVEL SECURITY;

-- Only admins and uno_team can manage commission rules
CREATE POLICY "Admins can manage commission rules"
ON public.vertical_commission_rules
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'uno_team')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'uno_team')
);

-- Add financial tracking columns to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vendor_payout_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_rate_applied NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS vertical TEXT;

-- Insert default commission rules for each vertical
INSERT INTO public.vertical_commission_rules (vertical, base_commission, notes) VALUES
('yacht', 12, 'Яхты и водный транспорт'),
('property', 10, 'Аренда недвижимости'),
('property_sale', 3, 'Продажа недвижимости'),
('tour', 15, 'Туры и экскурсии'),
('transport', 12, 'Транспортные услуги'),
('restaurant', 10, 'Рестораны и кафе'),
('spa', 12, 'Спа и велнес'),
('clinic', 10, 'Медицинские услуги'),
('event', 15, 'Мероприятия и билеты'),
('flower', 12, 'Цветы и подарки'),
('cleaning', 15, 'Клининг'),
('babysitter', 15, 'Няни и уход за детьми'),
('education', 12, 'Образование'),
('legal', 10, 'Юридические услуги'),
('insurance', 8, 'Страхование')
ON CONFLICT (vertical) DO NOTHING;

-- Create function to calculate commission on orders
CREATE OR REPLACE FUNCTION public.calculate_order_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_rate NUMERIC(5,2);
  v_provider_rate NUMERIC(5,2);
  v_vertical_rate NUMERIC(5,2);
  v_tiered_rates JSONB;
  v_provider_gmv NUMERIC;
  v_tier RECORD;
BEGIN
  -- Priority 1: Provider's individual rate
  SELECT commission_rate INTO v_provider_rate
  FROM providers
  WHERE id = NEW.provider_org_id;
  
  IF v_provider_rate IS NOT NULL AND v_provider_rate > 0 THEN
    v_commission_rate := v_provider_rate;
  ELSE
    -- Priority 2: Vertical rate with tiers
    SELECT base_commission, tiered_rates INTO v_vertical_rate, v_tiered_rates
    FROM vertical_commission_rules
    WHERE vertical = COALESCE(NEW.vertical, NEW.order_type)
    AND is_active = true;
    
    IF v_vertical_rate IS NOT NULL THEN
      -- Check if tiered rates apply
      IF v_tiered_rates IS NOT NULL AND jsonb_array_length(v_tiered_rates->'tiers') > 0 THEN
        -- Get provider's total GMV
        SELECT COALESCE(SUM(total_amount), 0) INTO v_provider_gmv
        FROM orders
        WHERE provider_org_id = NEW.provider_org_id
        AND status = 'completed';
        
        -- Find applicable tier
        FOR v_tier IN 
          SELECT * FROM jsonb_to_recordset(v_tiered_rates->'tiers') 
          AS x(min_gmv numeric, max_gmv numeric, rate numeric)
          ORDER BY min_gmv DESC
        LOOP
          IF v_provider_gmv >= v_tier.min_gmv AND (v_tier.max_gmv IS NULL OR v_provider_gmv < v_tier.max_gmv) THEN
            v_commission_rate := v_tier.rate;
            EXIT;
          END IF;
        END LOOP;
        
        IF v_commission_rate IS NULL THEN
          v_commission_rate := v_vertical_rate;
        END IF;
      ELSE
        v_commission_rate := v_vertical_rate;
      END IF;
    ELSE
      -- Priority 3: Default rate
      v_commission_rate := 10;
    END IF;
  END IF;
  
  -- Calculate amounts
  NEW.commission_rate_applied := v_commission_rate;
  NEW.platform_fee_amount := ROUND((NEW.total_amount * v_commission_rate / 100), 2);
  NEW.vendor_payout_amount := NEW.total_amount - NEW.platform_fee_amount;
  
  -- Set vertical if not set
  IF NEW.vertical IS NULL THEN
    NEW.vertical := NEW.order_type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new orders
DROP TRIGGER IF EXISTS calculate_order_commission_trigger ON orders;
CREATE TRIGGER calculate_order_commission_trigger
BEFORE INSERT OR UPDATE OF total_amount ON orders
FOR EACH ROW
EXECUTE FUNCTION calculate_order_commission();

-- Update existing orders with commission data
UPDATE orders
SET 
  commission_rate_applied = 10,
  platform_fee_amount = ROUND(total_amount * 0.10, 2),
  vendor_payout_amount = total_amount - ROUND(total_amount * 0.10, 2),
  vertical = order_type
WHERE platform_fee_amount = 0 OR platform_fee_amount IS NULL;

-- Create updated_at trigger for commission rules
DROP TRIGGER IF EXISTS update_vertical_commission_rules_updated_at ON vertical_commission_rules;
CREATE TRIGGER update_vertical_commission_rules_updated_at
BEFORE UPDATE ON vertical_commission_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- Migration: 20260121032053_cc62d61a-e030-4e22-be22-9d5f366323ba.sql
-- Phase 1: Critical Fixes

-- 1. Create atomic payout processing function
CREATE OR REPLACE FUNCTION public.process_payout(
  p_payout_id UUID,
  p_new_status TEXT,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout RECORD;
  v_provider RECORD;
  v_new_pending NUMERIC;
BEGIN
  -- Get payout details with lock
  SELECT * INTO v_payout 
  FROM vendor_payouts 
  WHERE id = p_payout_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Payout not found');
  END IF;
  
  -- Validate status transition
  IF v_payout.status NOT IN ('pending', 'processing') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid payout status for processing');
  END IF;
  
  IF p_new_status NOT IN ('completed', 'failed') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid target status');
  END IF;
  
  -- Update payout status
  UPDATE vendor_payouts
  SET 
    status = p_new_status,
    processed_at = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE processed_at END,
    payment_reference = COALESCE(p_payment_reference, payment_reference)
  WHERE id = p_payout_id;
  
  -- If completed, atomically update provider balance
  IF p_new_status = 'completed' THEN
    -- Get provider with lock
    SELECT * INTO v_provider 
    FROM providers 
    WHERE id = v_payout.provider_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Provider not found');
    END IF;
    
    -- Calculate new pending amount (never go negative)
    v_new_pending := GREATEST(0, COALESCE(v_provider.pending_payout, 0) - v_payout.amount);
    
    -- Update provider balance
    UPDATE providers
    SET 
      pending_payout = v_new_pending,
      updated_at = NOW()
    WHERE id = v_payout.provider_id;
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'payout_id', p_payout_id,
    'new_status', p_new_status
  );
END;
$$;

-- 2. Sync vertical keys - add missing verticals to commission rules
INSERT INTO vertical_commission_rules (vertical, base_commission, notes, is_active)
VALUES 
  ('restaurant', 0.12, 'Restaurant bookings - synced with food vertical', true),
  ('spa', 0.15, 'Spa and wellness services', true),
  ('clinic', 0.10, 'Medical clinic services', true),
  ('legal', 0.08, 'Legal services', true),
  ('insurance', 0.10, 'Insurance services', true),
  ('water_activity', 0.15, 'Water activities', true),
  ('transfer', 0.10, 'Airport transfers', true)
ON CONFLICT (vertical) DO NOTHING;

-- 3. Create function to get proper vertical from order metadata
CREATE OR REPLACE FUNCTION public.get_order_vertical(p_order_type TEXT, p_metadata JSONB)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Map order types to financial verticals
  RETURN CASE p_order_type
    WHEN 'food' THEN 'restaurant'
    WHEN 'vehicle' THEN COALESCE(p_metadata->>'vehicle_type', 'vehicle')
    ELSE p_order_type
  END;
END;
$$;

-- 4. Update calculate_order_commission to use proper vertical mapping
CREATE OR REPLACE FUNCTION public.calculate_order_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_rate NUMERIC;
  v_provider_rate NUMERIC;
  v_vertical_rule RECORD;
  v_vertical TEXT;
BEGIN
  -- Skip if already calculated or no amount
  IF NEW.platform_fee_amount IS NOT NULL AND NEW.platform_fee_amount > 0 THEN
    RETURN NEW;
  END IF;
  
  IF NEW.total_amount IS NULL OR NEW.total_amount <= 0 THEN
    RETURN NEW;
  END IF;
  
  -- Get proper vertical
  v_vertical := public.get_order_vertical(NEW.order_type, NEW.metadata);
  NEW.vertical := v_vertical;
  
  -- 1. Try provider-specific rate first
  SELECT commission_rate INTO v_provider_rate
  FROM providers
  WHERE id = NEW.provider_org_id;
  
  IF v_provider_rate IS NOT NULL AND v_provider_rate > 0 THEN
    v_commission_rate := v_provider_rate / 100;
  ELSE
    -- 2. Try vertical-specific rule
    SELECT * INTO v_vertical_rule
    FROM vertical_commission_rules
    WHERE vertical = v_vertical AND is_active = true;
    
    IF FOUND THEN
      -- Check for tiered rates
      IF v_vertical_rule.tiered_rates IS NOT NULL THEN
        SELECT rate INTO v_commission_rate
        FROM jsonb_to_recordset(v_vertical_rule.tiered_rates->'tiers') 
          AS t(min_gmv NUMERIC, max_gmv NUMERIC, rate NUMERIC)
        WHERE NEW.total_amount >= min_gmv 
          AND (max_gmv IS NULL OR NEW.total_amount < max_gmv)
        LIMIT 1;
      END IF;
      
      IF v_commission_rate IS NULL THEN
        v_commission_rate := v_vertical_rule.base_commission;
      END IF;
      
      -- Apply min/max constraints
      IF v_vertical_rule.min_commission_amount IS NOT NULL THEN
        v_commission_rate := GREATEST(
          v_commission_rate,
          v_vertical_rule.min_commission_amount / NULLIF(NEW.total_amount, 0)
        );
      END IF;
      
      IF v_vertical_rule.max_commission_amount IS NOT NULL THEN
        v_commission_rate := LEAST(
          v_commission_rate,
          v_vertical_rule.max_commission_amount / NULLIF(NEW.total_amount, 0)
        );
      END IF;
    ELSE
      -- 3. Default rate
      v_commission_rate := 0.10;
    END IF;
  END IF;
  
  -- Calculate amounts
  NEW.commission_rate_applied := v_commission_rate;
  NEW.platform_fee_amount := ROUND(NEW.total_amount * v_commission_rate, 2);
  NEW.vendor_payout_amount := NEW.total_amount - NEW.platform_fee_amount;
  
  RETURN NEW;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.process_payout TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_vertical TO authenticated;
-- Migration: 20260121032617_e0d434b3-4415-4124-ae09-06da3333f84a.sql
-- Phase 2: Financial Accuracy

-- 1. Create function to calculate cashback for an order
CREATE OR REPLACE FUNCTION public.calculate_order_cashback(
  p_order_id UUID,
  p_category TEXT DEFAULT 'default'
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_settings RECORD;
  v_cashback_amount NUMERIC := 0;
BEGIN
  -- Get order details
  SELECT total_amount, currency INTO v_order
  FROM orders
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Get cashback settings for category (or default)
  SELECT * INTO v_settings
  FROM cashback_settings
  WHERE (category = p_category OR category = 'default')
    AND is_active = true
  ORDER BY CASE WHEN category = p_category THEN 0 ELSE 1 END
  LIMIT 1;
  
  IF NOT FOUND OR v_settings.percentage <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Check minimum order amount
  IF v_settings.min_order_amount IS NOT NULL AND v_order.total_amount < v_settings.min_order_amount THEN
    RETURN 0;
  END IF;
  
  -- Calculate cashback
  v_cashback_amount := ROUND(v_order.total_amount * v_settings.percentage / 100, 2);
  
  -- Apply max cashback limit
  IF v_settings.max_cashback_amount IS NOT NULL AND v_cashback_amount > v_settings.max_cashback_amount THEN
    v_cashback_amount := v_settings.max_cashback_amount;
  END IF;
  
  RETURN v_cashback_amount;
END;
$$;

-- 2. Create function to get subscription revenue (actual prices from plans)
CREATE OR REPLACE FUNCTION public.get_subscription_revenue(p_days INT DEFAULT 30)
RETURNS TABLE(
  total_revenue NUMERIC,
  active_count INT,
  monthly_count INT,
  yearly_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN vs.billing_cycle = 'yearly' THEN COALESCE(sp.price_yearly, 0) / 12
        ELSE COALESCE(sp.price_monthly, 0)
      END
    ), 0::NUMERIC) AS total_revenue,
    COUNT(*)::INT AS active_count,
    COUNT(*) FILTER (WHERE vs.billing_cycle = 'monthly')::INT AS monthly_count,
    COUNT(*) FILTER (WHERE vs.billing_cycle = 'yearly')::INT AS yearly_count
  FROM vendor_subscriptions vs
  LEFT JOIN subscription_plans sp ON vs.plan_id = sp.id
  WHERE vs.status = 'active';
END;
$$;

-- 3. Create utility function for calculating order total with fees
CREATE OR REPLACE FUNCTION public.calculate_order_totals(
  p_base_amount NUMERIC,
  p_vertical TEXT DEFAULT 'service',
  p_provider_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_rate NUMERIC := 0.10; -- default 10%
  v_provider_rate NUMERIC;
  v_vertical_rule RECORD;
  v_platform_fee NUMERIC;
  v_vendor_amount NUMERIC;
  v_service_fee NUMERIC := 0; -- optional customer service fee
BEGIN
  -- 1. Check provider-specific rate
  IF p_provider_id IS NOT NULL THEN
    SELECT commission_rate INTO v_provider_rate
    FROM providers
    WHERE id = p_provider_id;
    
    IF v_provider_rate IS NOT NULL AND v_provider_rate > 0 THEN
      v_commission_rate := v_provider_rate / 100;
    END IF;
  END IF;
  
  -- 2. If no provider rate, check vertical rules
  IF v_provider_rate IS NULL OR v_provider_rate = 0 THEN
    SELECT * INTO v_vertical_rule
    FROM vertical_commission_rules
    WHERE vertical = p_vertical AND is_active = true;
    
    IF FOUND THEN
      -- Check for tiered rates
      IF v_vertical_rule.tiered_rates IS NOT NULL THEN
        SELECT rate INTO v_commission_rate
        FROM jsonb_to_recordset(v_vertical_rule.tiered_rates->'tiers') 
          AS t(min_gmv NUMERIC, max_gmv NUMERIC, rate NUMERIC)
        WHERE p_base_amount >= min_gmv 
          AND (max_gmv IS NULL OR p_base_amount < max_gmv)
        LIMIT 1;
      END IF;
      
      IF v_commission_rate IS NULL OR v_commission_rate = 0 THEN
        v_commission_rate := COALESCE(v_vertical_rule.base_commission, 0.10);
      END IF;
    END IF;
  END IF;
  
  -- Calculate fees
  v_platform_fee := ROUND(p_base_amount * v_commission_rate, 2);
  v_vendor_amount := p_base_amount - v_platform_fee;
  
  -- Return all calculated values
  RETURN json_build_object(
    'base_amount', p_base_amount,
    'commission_rate', v_commission_rate,
    'platform_fee', v_platform_fee,
    'vendor_amount', v_vendor_amount,
    'service_fee', v_service_fee,
    'total_customer_pays', p_base_amount + v_service_fee
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.calculate_order_cashback TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_revenue TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_order_totals TO authenticated;
-- Migration: 20260121033406_7d32c051-2b21-4613-a5bf-fbb9baff7b34.sql
-- Phase 4: Feature Parity - Database enhancements

-- 1. Add restaurant_availability table for dynamic slot management
CREATE TABLE IF NOT EXISTS public.restaurant_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  max_covers INTEGER NOT NULL DEFAULT 20,
  booked_covers INTEGER NOT NULL DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, date, time_slot)
);

-- Enable RLS
ALTER TABLE public.restaurant_availability ENABLE ROW LEVEL SECURITY;

-- Anyone can read availability
CREATE POLICY "Anyone can read restaurant availability" 
  ON public.restaurant_availability FOR SELECT 
  USING (true);

-- Providers can manage their restaurant availability
CREATE POLICY "Providers can manage their restaurant availability" 
  ON public.restaurant_availability FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM restaurants r 
      JOIN providers p ON r.provider_id = p.id 
      WHERE r.id = restaurant_id AND p.user_id = auth.uid()
    )
  );

-- 2. Add realtime support for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;

-- 3. Function to check restaurant availability
CREATE OR REPLACE FUNCTION check_restaurant_availability(
  p_restaurant_id UUID,
  p_date DATE,
  p_time TIME,
  p_covers INTEGER DEFAULT 2
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot RECORD;
  v_available_covers INTEGER;
BEGIN
  -- Check if there's a specific slot entry
  SELECT * INTO v_slot
  FROM restaurant_availability
  WHERE restaurant_id = p_restaurant_id
    AND date = p_date
    AND time_slot = p_time;
  
  IF FOUND THEN
    -- Check if blocked
    IF v_slot.is_blocked THEN
      RETURN jsonb_build_object(
        'available', false,
        'reason', 'Time slot is blocked',
        'spots_remaining', 0
      );
    END IF;
    
    v_available_covers := v_slot.max_covers - v_slot.booked_covers;
    
    RETURN jsonb_build_object(
      'available', v_available_covers >= p_covers,
      'spots_remaining', v_available_covers,
      'max_covers', v_slot.max_covers
    );
  END IF;
  
  -- No specific slot, check general restaurant capacity from orders
  SELECT COALESCE(SUM((metadata->>'guests')::int), 0) INTO v_available_covers
  FROM orders
  WHERE order_type = 'food'
    AND metadata->>'restaurant_id' = p_restaurant_id::text
    AND DATE(start_at) = p_date
    AND start_at::time BETWEEN p_time - interval '1 hour' AND p_time + interval '1 hour'
    AND status NOT IN ('cancelled', 'refunded');
  
  -- Default max covers per slot is 30
  RETURN jsonb_build_object(
    'available', (30 - v_available_covers) >= p_covers,
    'spots_remaining', GREATEST(0, 30 - v_available_covers),
    'max_covers', 30
  );
END;
$$;

-- 4. Function to get order timeline for tracking
CREATE OR REPLACE FUNCTION get_order_timeline(p_order_id UUID)
RETURNS TABLE (
  status TEXT,
  actor_name TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    osh.to_status::text as status,
    COALESCE(pr.full_name, 'System') as actor_name,
    osh.reason,
    osh.created_at
  FROM order_status_history osh
  LEFT JOIN profiles pr ON osh.actor_user_id = pr.id
  WHERE osh.order_id = p_order_id
  ORDER BY osh.created_at ASC;
END;
$$;

-- 5. Function to verify if user purchased an item (for reviews)
CREATE OR REPLACE FUNCTION is_verified_purchase(
  p_user_id UUID,
  p_item_type TEXT,
  p_item_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_order BOOLEAN;
BEGIN
  -- Check in orders table
  SELECT EXISTS (
    SELECT 1 FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.customer_user_id = p_user_id
      AND o.status IN ('completed', 'confirmed')
      AND (
        oi.product_id = p_item_id 
        OR oi.resource_id = p_item_id
        OR o.metadata->>'entity_id' = p_item_id::text
      )
  ) INTO v_has_order;
  
  IF v_has_order THEN
    RETURN true;
  END IF;
  
  -- Check legacy bookings table
  SELECT EXISTS (
    SELECT 1 FROM bookings b
    JOIN booking_items bi ON b.id = bi.booking_id
    WHERE b.user_id = p_user_id
      AND b.status IN ('completed', 'confirmed')
      AND bi.item_id = p_item_id::text
  ) INTO v_has_order;
  
  RETURN v_has_order;
END;
$$;

-- 6. Trigger to auto-set is_verified_purchase on review insert
CREATE OR REPLACE FUNCTION set_review_verified_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.is_verified_purchase := is_verified_purchase(
    NEW.user_id,
    NEW.item_type,
    NEW.item_id::uuid
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_review_verified ON reviews;
CREATE TRIGGER trg_set_review_verified
  BEFORE INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION set_review_verified_status();

-- 7. Index for faster order timeline queries
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id 
  ON order_status_history(order_id, created_at);

-- 8. Index for restaurant availability lookups
CREATE INDEX IF NOT EXISTS idx_restaurant_availability_lookup 
  ON restaurant_availability(restaurant_id, date, time_slot);

