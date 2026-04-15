-- B2B personas: real estate developers & local service providers (landing + home role chips)
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'real_estate_developer';
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'local_services_provider';
