
-- Make property_id nullable so we can send task notifications without a property
ALTER TABLE public.owner_notifications ALTER COLUMN property_id DROP NOT NULL;
