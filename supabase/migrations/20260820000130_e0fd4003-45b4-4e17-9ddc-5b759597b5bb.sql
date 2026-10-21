DROP POLICY IF EXISTS "Managers can send messages" ON public.property_chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.property_chat_messages;
DROP POLICY IF EXISTS "Users can send property messages" ON public.property_chat_messages;

CREATE POLICY "Chat: participant scoped insert"
ON public.property_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND (
    is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_chat_messages.property_id
        AND (
          p.owner_id = auth.uid()
          OR p.managed_by = auth.uid()
          OR p.provider_id IN (SELECT pr.id FROM public.providers pr WHERE pr.user_id = auth.uid())
        )
    )
    OR (
      booking_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.property_bookings b
        WHERE b.id = property_chat_messages.booking_id
          AND b.guest_id = auth.uid()
      )
    )
  )
);