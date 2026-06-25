DROP POLICY IF EXISTS "Users can view their conversation messages" ON public.property_chat_messages;
CREATE POLICY "Users can view their conversation messages"
ON public.property_chat_messages
FOR SELECT
TO authenticated
USING (
  sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_chat_messages.property_id
      AND p.owner_id = auth.uid()
  )
  OR (
    booking_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.property_bookings b
      WHERE b.id = property_chat_messages.booking_id
        AND b.guest_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can mark messages as read" ON public.property_chat_messages;
CREATE POLICY "Users can mark messages as read"
ON public.property_chat_messages
FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_chat_messages.property_id
      AND p.owner_id = auth.uid()
  )
  OR (
    booking_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.property_bookings b
      WHERE b.id = property_chat_messages.booking_id
        AND b.guest_id = auth.uid()
    )
  )
)
WITH CHECK (
  sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_chat_messages.property_id
      AND p.owner_id = auth.uid()
  )
  OR (
    booking_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.property_bookings b
      WHERE b.id = property_chat_messages.booking_id
        AND b.guest_id = auth.uid()
    )
  )
);