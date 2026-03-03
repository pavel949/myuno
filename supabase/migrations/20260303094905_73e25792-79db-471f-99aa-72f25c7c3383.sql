
-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view their conversation messages" ON public.property_chat_messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.property_chat_messages;

-- Create a security definer function to check if user is participant in a property chat
CREATE OR REPLACE FUNCTION public.is_chat_participant(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM property_chat_messages
    WHERE sender_id = _user_id AND property_id = _property_id
    LIMIT 1
  )
$$;

-- Recreate SELECT policy without self-referencing subquery
CREATE POLICY "Users can view their conversation messages"
ON public.property_chat_messages FOR SELECT TO authenticated
USING (
  sender_id = auth.uid()
  OR EXISTS (SELECT 1 FROM properties p WHERE p.id = property_chat_messages.property_id AND p.owner_id = auth.uid())
  OR public.is_chat_participant(auth.uid(), property_chat_messages.property_id)
);

-- Recreate UPDATE policy without self-referencing subquery
CREATE POLICY "Users can mark messages as read"
ON public.property_chat_messages FOR UPDATE TO authenticated
USING (
  sender_id = auth.uid()
  OR EXISTS (SELECT 1 FROM properties p WHERE p.id = property_chat_messages.property_id AND p.owner_id = auth.uid())
  OR public.is_chat_participant(auth.uid(), property_chat_messages.property_id)
)
WITH CHECK (true);
