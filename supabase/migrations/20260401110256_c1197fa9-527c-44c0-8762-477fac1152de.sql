-- Add 6 new values to user_persona enum
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'investor';
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'family';
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'couple';
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'nightlife';
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'business';
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'nomad';