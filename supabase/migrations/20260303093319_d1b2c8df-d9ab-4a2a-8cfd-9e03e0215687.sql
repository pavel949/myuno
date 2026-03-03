
-- Add SELECT policy for regular users to see messages in conversations they participate in
CREATE POLICY "Users can view their conversation messages"
ON public.property_chat_messages
FOR SELECT
TO authenticated
USING (
  -- User sent the message
  sender_id = auth.uid()
  OR
  -- User owns the property
  EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = property_chat_messages.property_id 
    AND p.owner_id = auth.uid()
  )
  OR
  -- User is a guest who has sent messages in this conversation
  EXISTS (
    SELECT 1 FROM public.property_chat_messages pcm2
    WHERE pcm2.sender_id = auth.uid()
    AND pcm2.property_id = property_chat_messages.property_id
    AND (
      (pcm2.booking_id IS NULL AND property_chat_messages.booking_id IS NULL)
      OR pcm2.booking_id = property_chat_messages.booking_id
    )
  )
);

-- Add UPDATE policy for marking messages as read
CREATE POLICY "Users can mark messages as read"
ON public.property_chat_messages
FOR UPDATE
TO authenticated
USING (
  -- Can mark messages as read in conversations they participate in
  sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = property_chat_messages.property_id 
    AND p.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.property_chat_messages pcm2
    WHERE pcm2.sender_id = auth.uid()
    AND pcm2.property_id = property_chat_messages.property_id
  )
)
WITH CHECK (true);
