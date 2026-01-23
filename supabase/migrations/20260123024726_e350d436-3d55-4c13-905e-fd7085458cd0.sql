-- Create order_item_flower_details table for flowers-specific booking data
CREATE TABLE public.order_item_flower_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL UNIQUE REFERENCES public.order_items(id) ON DELETE CASCADE,
  recipient_name TEXT,
  recipient_phone TEXT,
  delivery_address TEXT,
  delivery_slot TEXT,
  message_card TEXT,
  gift_wrap BOOLEAN DEFAULT false,
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_item_flower_details ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own flower order details"
ON public.order_item_flower_details FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_id
    AND o.customer_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own flower order details"
ON public.order_item_flower_details FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_id
    AND o.customer_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all flower order details"
ON public.order_item_flower_details FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "UNO team can manage all flower order details"
ON public.order_item_flower_details FOR ALL
USING (public.has_role(auth.uid(), 'uno_team'));

-- Add index for performance
CREATE INDEX idx_order_item_flower_details_order_item_id 
ON public.order_item_flower_details(order_item_id);