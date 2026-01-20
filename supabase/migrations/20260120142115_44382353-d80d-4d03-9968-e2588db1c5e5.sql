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