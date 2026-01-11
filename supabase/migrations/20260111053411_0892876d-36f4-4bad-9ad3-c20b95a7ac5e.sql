-- Extend property_financials with more categories and fields for full accounting
-- Add new columns for tax tracking, depreciation, deposits, loans

-- First, let's ensure we have all the transaction types and categories we need
-- The existing table already has: transaction_type, category, amount, currency, description, receipt_url

-- Add additional columns for enhanced financial tracking
ALTER TABLE public.property_financials
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS tax_deductible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_interval TEXT, -- monthly, quarterly, yearly
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS paid_date DATE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed', -- pending, completed, overdue
ADD COLUMN IF NOT EXISTS vendor_name TEXT,
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create property chat messages table for group chat
CREATE TABLE IF NOT EXISTS public.property_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.property_bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'owner', -- owner, guest, manager
  sender_name TEXT,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat messages
-- Owners can see messages for their properties
CREATE POLICY "Owners can view messages for their properties"
ON public.property_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = property_chat_messages.property_id
    AND op.owner_id = auth.uid()
  )
  OR sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.property_bookings pb
    JOIN public.owner_properties op ON pb.property_id = op.id
    WHERE pb.id = property_chat_messages.booking_id
    AND (pb.owner_id = auth.uid() OR op.owner_id = auth.uid())
  )
);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.property_chat_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Managers can see all messages (using has_role function)
CREATE POLICY "Managers can view all messages"
ON public.property_chat_messages
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendor')
);

-- Managers can send messages
CREATE POLICY "Managers can send messages"
ON public.property_chat_messages
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendor')
);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_chat_messages;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_chat_property_id ON public.property_chat_messages(property_id);
CREATE INDEX IF NOT EXISTS idx_property_chat_booking_id ON public.property_chat_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_property_chat_created_at ON public.property_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_financials_property ON public.property_financials(property_id);
CREATE INDEX IF NOT EXISTS idx_property_financials_date ON public.property_financials(transaction_date DESC);