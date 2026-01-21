-- Add uno_team tracking columns to main content tables
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.yachts ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.yachts ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.water_activities ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.water_activities ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.cleaning_services ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.cleaning_services ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.babysitters ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.babysitters ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.education_providers ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.education_providers ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.flower_shops ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.flower_shops ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.pet_services ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.pet_services ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

ALTER TABLE public.insurance_providers ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false;
ALTER TABLE public.insurance_providers ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);