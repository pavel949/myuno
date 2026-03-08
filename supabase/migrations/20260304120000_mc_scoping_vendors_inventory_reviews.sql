-- =============================================
-- MC scoping: Vendors, Inventory, Reviews
-- So management company staff see company-wide data,
-- not only records tied to their personal owner_id.
-- =============================================

-- ---------------------------------------------------------------------------
-- 1. VENDORS: Add company_id to owner_service_vendors
-- ---------------------------------------------------------------------------
ALTER TABLE public.owner_service_vendors
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.management_companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_owner_service_vendors_company_id
  ON public.owner_service_vendors(company_id);

-- MC members can access vendors belonging to their company
DROP POLICY IF EXISTS "Owners manage own vendors" ON public.owner_service_vendors;
CREATE POLICY "Owners manage own vendors"
  ON public.owner_service_vendors FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "MC members access company vendors"
  ON public.owner_service_vendors FOR ALL
  USING (
    company_id IS NOT NULL
    AND company_id IN (
      SELECT company_id FROM public.management_company_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    company_id IS NOT NULL
    AND company_id IN (
      SELECT company_id FROM public.management_company_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- 2. INVENTORY: MC members can manage inventory for company properties
-- ---------------------------------------------------------------------------
-- Existing policy uses owner_properties (owner_id). Add policy for MC.
CREATE POLICY "MC members manage company property inventory"
  ON public.property_inventory_items FOR ALL
  USING (
    property_id IN (
      SELECT id FROM public.properties
      WHERE management_company_id IN (
        SELECT company_id FROM public.management_company_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties
      WHERE management_company_id IN (
        SELECT company_id FROM public.management_company_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 3. REVIEWS: MC members can view and update reviews for company properties
-- ---------------------------------------------------------------------------
CREATE POLICY "MC members manage company property reviews"
  ON public.property_reviews FOR ALL
  USING (
    property_id IN (
      SELECT id FROM public.properties
      WHERE management_company_id IN (
        SELECT company_id FROM public.management_company_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties
      WHERE management_company_id IN (
        SELECT company_id FROM public.management_company_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );
