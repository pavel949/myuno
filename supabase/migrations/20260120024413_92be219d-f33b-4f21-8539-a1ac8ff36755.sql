-- Add new marker columns for events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS is_global boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_last_minute boolean DEFAULT false;

-- Update some events with new markers
UPDATE public.events SET is_global = true WHERE title_en ILIKE '%festival%' OR title_en ILIKE '%jazz%';
UPDATE public.events SET is_recurring = true WHERE title_en ILIKE '%club%' OR title_en ILIKE '%saturday%';
UPDATE public.events SET is_last_minute = true WHERE spots_left < 20;