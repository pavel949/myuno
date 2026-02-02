-- Add seller_type enum for marketplace
DO $$ BEGIN
  CREATE TYPE public.marketplace_seller_type AS ENUM ('business', 'individual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add item condition enum
DO $$ BEGIN
  CREATE TYPE public.item_condition AS ENUM ('new', 'like_new', 'good', 'fair', 'for_parts');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add seller_type and condition columns to marketplace_products
ALTER TABLE public.marketplace_products 
ADD COLUMN IF NOT EXISTS seller_type text DEFAULT 'business',
ADD COLUMN IF NOT EXISTS condition text DEFAULT 'new',
ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS contact_whatsapp text,
ADD COLUMN IF NOT EXISTS is_negotiable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Create user_listings table for C2C marketplace
CREATE TABLE IF NOT EXISTS public.user_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  title_en text NOT NULL,
  title_ru text,
  description_en text,
  description_ru text,
  
  -- Categorization
  category_slug text,
  subcategory text,
  
  -- Pricing
  price numeric NOT NULL,
  original_price numeric,
  currency text DEFAULT 'THB',
  is_negotiable boolean DEFAULT true,
  
  -- Condition
  condition text DEFAULT 'good',
  
  -- Media
  cover_image text,
  images text[],
  
  -- Location & Contact
  location text,
  contact_phone text,
  contact_whatsapp text,
  show_phone boolean DEFAULT false,
  
  -- Status
  status text DEFAULT 'draft', -- draft, pending, active, sold, expired, removed
  moderation_status text DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason text,
  
  -- Metrics
  views_count integer DEFAULT 0,
  favorites_count integer DEFAULT 0,
  
  -- Timestamps
  published_at timestamptz,
  expires_at timestamptz,
  sold_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_listings_user_id ON public.user_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_listings_status ON public.user_listings(status);
CREATE INDEX IF NOT EXISTS idx_user_listings_category ON public.user_listings(category_slug);
CREATE INDEX IF NOT EXISTS idx_user_listings_created ON public.user_listings(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_listings
CREATE POLICY "Users can view active listings"
ON public.user_listings FOR SELECT
USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can create their own listings"
ON public.user_listings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
ON public.user_listings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
ON public.user_listings FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_user_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_listings_updated_at ON public.user_listings;
CREATE TRIGGER update_user_listings_updated_at
BEFORE UPDATE ON public.user_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_user_listings_updated_at();

-- Backfill existing marketplace_products as business listings
UPDATE public.marketplace_products 
SET seller_type = 'business' 
WHERE seller_type IS NULL;