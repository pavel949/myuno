-- Add size_variants JSONB column for S/M/L pricing
-- Structure: [{ size: 'S', label_en: 'Small', label_ru: 'Маленький', price: 1500, flower_count: 15 }, ...]

ALTER TABLE public.bouquets 
ADD COLUMN IF NOT EXISTS size_variants JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.bouquets.size_variants IS 'Array of size variants: [{size, label_en, label_ru, price, flower_count}]';

-- Create index for faster queries on variants
CREATE INDEX IF NOT EXISTS idx_bouquets_size_variants ON public.bouquets USING GIN (size_variants);

-- Update the price column comment
COMMENT ON COLUMN public.bouquets.price IS 'Base price (Size S). Use size_variants for all size prices.';