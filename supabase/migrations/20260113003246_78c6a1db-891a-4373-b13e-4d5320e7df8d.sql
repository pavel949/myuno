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