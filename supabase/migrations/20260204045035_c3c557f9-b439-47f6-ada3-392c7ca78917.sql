-- Add new order statuses for concierge advance payment flow
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pending_advance';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'awaiting_client_payment';

-- Add concierge fee column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS concierge_fee_amount NUMERIC(10,2) DEFAULT 0;

-- Add vertical for concierge advance in lookup_values
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order, is_active)
VALUES ('vertical', 'concierge_advance', 'Concierge Advance', 'Аванс через консьержа', '💸', 50, true)
ON CONFLICT (lookup_type, value_key) DO NOTHING;