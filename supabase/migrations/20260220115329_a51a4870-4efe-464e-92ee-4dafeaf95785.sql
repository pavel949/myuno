-- Add min_quantity to property_inventory_items for low-stock alerts
ALTER TABLE public.property_inventory_items 
ADD COLUMN IF NOT EXISTS min_quantity integer DEFAULT 0;

-- Add reorder_note column for reorder instructions
ALTER TABLE public.property_inventory_items 
ADD COLUMN IF NOT EXISTS reorder_note text;
