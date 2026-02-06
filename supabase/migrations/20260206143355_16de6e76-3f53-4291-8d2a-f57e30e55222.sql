
-- Add missing columns to restaurants table for data quality pipeline
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS city text DEFAULT 'Phuket',
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS cuisine_tags text[],
  ADD COLUMN IF NOT EXISTS price_level text CHECK (price_level IN ('$', '$$', '$$$', '$$$$')),
  ADD COLUMN IF NOT EXISTS avg_check_thb integer,
  ADD COLUMN IF NOT EXISTS reservation_supported boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reservation_provider text CHECK (reservation_provider IN ('chope', 'tablecheck', 'website', 'phone')),
  ADD COLUMN IF NOT EXISTS reservation_url text,
  ADD COLUMN IF NOT EXISTS reservation_policy text,
  ADD COLUMN IF NOT EXISTS delivery_provider text CHECK (delivery_provider IN ('grabfood', 'foodpanda', 'website', 'none')),
  ADD COLUMN IF NOT EXISTS order_url text,
  ADD COLUMN IF NOT EXISTS grabfood_search_query text,
  ADD COLUMN IF NOT EXISTS menu_url text,
  ADD COLUMN IF NOT EXISTS menu_last_updated_note text,
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS gallery_image_urls text[],
  ADD COLUMN IF NOT EXISTS data_sources jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS needs_manual_verification boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_notes text;

-- Create index for data quality filtering
CREATE INDEX IF NOT EXISTS idx_restaurants_needs_verification ON public.restaurants(needs_manual_verification) WHERE needs_manual_verification = true;
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON public.restaurants(city);
