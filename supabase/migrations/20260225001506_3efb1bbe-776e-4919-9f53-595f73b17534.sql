
-- Add AI auto-reply flag to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS ai_autoreply_enabled boolean NOT NULL DEFAULT false;

-- Add AI auto-reply custom instructions (optional owner customization)
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS ai_autoreply_instructions text;

COMMENT ON COLUMN public.properties.ai_autoreply_enabled IS 'Enable AI-generated auto-replies to guest messages';
COMMENT ON COLUMN public.properties.ai_autoreply_instructions IS 'Custom instructions for AI auto-reply tone/content';
