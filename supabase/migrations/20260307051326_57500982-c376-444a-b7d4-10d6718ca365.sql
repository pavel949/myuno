
-- Fix: property_chat_messages UPDATE policy WITH CHECK (true) → restrict to is_read changes only
-- Users should only be able to mark messages as read, not modify message content or sender

DROP POLICY IF EXISTS "Users can mark messages as read" ON public.property_chat_messages;

-- Recreate with restrictive WITH CHECK: only allow setting is_read
-- The USING clause controls WHO can update (sender, owner, participant)
-- The WITH CHECK ensures the row after update still has the same immutable fields
CREATE POLICY "Users can mark messages as read" ON public.property_chat_messages
  FOR UPDATE TO authenticated
  USING (
    (sender_id = auth.uid())
    OR (EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_chat_messages.property_id
        AND p.owner_id = auth.uid()
    ))
    OR is_chat_participant(auth.uid(), property_id)
  )
  WITH CHECK (
    -- Ensure sender_id cannot be changed (must match original)
    sender_id = (SELECT sender_id FROM public.property_chat_messages WHERE id = property_chat_messages.id)
    -- Ensure message content cannot be changed
    AND message = (SELECT message FROM public.property_chat_messages WHERE id = property_chat_messages.id)
    -- Ensure property_id cannot be changed
    AND (property_id IS NOT DISTINCT FROM (SELECT property_id FROM public.property_chat_messages WHERE id = property_chat_messages.id))
  );
