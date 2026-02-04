-- Add missing approval and tracking columns for admin-created content

-- Providers table: add approval_status and uno_team tracking
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

-- Services table: add missing columns
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

-- Marketplace products: add approval and tracking columns
ALTER TABLE public.marketplace_products 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

-- Marketplace vendors: add approval and tracking columns  
ALTER TABLE public.marketplace_vendors 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

-- Bouquets: add approval and tracking columns
ALTER TABLE public.bouquets 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

-- Create indexes for filtering by approval status
CREATE INDEX IF NOT EXISTS idx_providers_approval_status ON public.providers(approval_status);
CREATE INDEX IF NOT EXISTS idx_services_approval_status ON public.services(approval_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_approval_status ON public.marketplace_products(approval_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_vendors_approval_status ON public.marketplace_vendors(approval_status);
CREATE INDEX IF NOT EXISTS idx_bouquets_approval_status ON public.bouquets(approval_status);