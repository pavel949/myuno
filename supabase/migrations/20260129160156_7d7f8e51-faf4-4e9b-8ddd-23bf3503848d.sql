-- Add marketplace_vendor_id to providers table to unify vendor systems
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS marketplace_vendor_id UUID REFERENCES marketplace_vendors(id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_providers_marketplace_vendor 
ON providers(marketplace_vendor_id);

-- RLS policy: Vendors can insert their own products via the provider-marketplace_vendor link
CREATE POLICY "Vendors can insert own products" 
ON marketplace_products
FOR INSERT 
TO authenticated
WITH CHECK (
  vendor_id IN (
    SELECT mv.id FROM marketplace_vendors mv
    JOIN providers p ON p.marketplace_vendor_id = mv.id
    WHERE p.user_id = auth.uid()
  )
);

-- RLS policy: Vendors can update their own products
CREATE POLICY "Vendors can update own products" 
ON marketplace_products
FOR UPDATE 
TO authenticated
USING (
  vendor_id IN (
    SELECT mv.id FROM marketplace_vendors mv
    JOIN providers p ON p.marketplace_vendor_id = mv.id
    WHERE p.user_id = auth.uid()
  )
);

-- RLS policy: Vendors can delete their own products
CREATE POLICY "Vendors can delete own products" 
ON marketplace_products
FOR DELETE 
TO authenticated
USING (
  vendor_id IN (
    SELECT mv.id FROM marketplace_vendors mv
    JOIN providers p ON p.marketplace_vendor_id = mv.id
    WHERE p.user_id = auth.uid()
  )
);

-- RLS policy: Vendors can view their own products
CREATE POLICY "Vendors can view own products" 
ON marketplace_products
FOR SELECT 
TO authenticated
USING (
  vendor_id IN (
    SELECT mv.id FROM marketplace_vendors mv
    JOIN providers p ON p.marketplace_vendor_id = mv.id
    WHERE p.user_id = auth.uid()
  )
  OR is_active = true
);