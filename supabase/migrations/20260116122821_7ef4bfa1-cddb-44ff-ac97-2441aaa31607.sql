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