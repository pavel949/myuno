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