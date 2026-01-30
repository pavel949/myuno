-- Create enum for user personas (personalization preferences, not access roles)
CREATE TYPE public.user_persona AS ENUM ('tourist', 'resident', 'property_owner');

-- Create table for storing user persona preferences
CREATE TABLE public.user_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  persona user_persona NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, persona)
);

-- Enable RLS
ALTER TABLE public.user_personas ENABLE ROW LEVEL SECURITY;

-- Users can view their own personas
CREATE POLICY "Users can view own personas"
  ON public.user_personas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own personas
CREATE POLICY "Users can insert own personas"
  ON public.user_personas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own personas
CREATE POLICY "Users can update own personas"
  ON public.user_personas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own personas
CREATE POLICY "Users can delete own personas"
  ON public.user_personas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_user_personas_user_id ON public.user_personas(user_id);
CREATE INDEX idx_user_personas_active ON public.user_personas(user_id, is_active) WHERE is_active = true;