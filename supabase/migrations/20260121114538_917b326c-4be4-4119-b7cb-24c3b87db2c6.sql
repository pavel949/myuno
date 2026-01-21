-- Create pet_profiles table for pet management feature
CREATE TABLE public.pet_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  species VARCHAR(50) NOT NULL DEFAULT 'dog',
  breed VARCHAR(100),
  age_years INTEGER,
  age_months INTEGER,
  weight_kg DECIMAL(5,2),
  gender VARCHAR(20),
  photo TEXT,
  medical_notes TEXT,
  dietary_notes TEXT,
  vaccinations JSONB DEFAULT '[]'::jsonb,
  allergies TEXT[],
  microchip_id VARCHAR(50),
  is_neutered BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pet_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for pet_profiles
CREATE POLICY "Users can view their own pets"
  ON public.pet_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pets"
  ON public.pet_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pets"
  ON public.pet_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pets"
  ON public.pet_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_pet_profiles_updated_at
  BEFORE UPDATE ON public.pet_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes
CREATE INDEX idx_pet_profiles_user_id ON public.pet_profiles(user_id);
CREATE INDEX idx_pet_profiles_species ON public.pet_profiles(species);