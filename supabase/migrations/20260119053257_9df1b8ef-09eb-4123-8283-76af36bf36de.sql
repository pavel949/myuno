-- =====================================================
-- P0 FIX: LEGACY BOOKING TABLE WRITE BLOCKING
-- =====================================================

-- Block INSERT/UPDATE on tour_bookings
CREATE OR REPLACE FUNCTION public.block_deprecated_tour_bookings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Deprecated — use orders table. tour_bookings is no longer accepting writes.';
END;
$$;

DROP TRIGGER IF EXISTS block_tour_bookings_insert ON public.tour_bookings;
CREATE TRIGGER block_tour_bookings_insert
  BEFORE INSERT OR UPDATE ON public.tour_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.block_deprecated_tour_bookings();

-- Block INSERT/UPDATE on event_bookings
CREATE OR REPLACE FUNCTION public.block_deprecated_event_bookings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Deprecated — use orders table. event_bookings is no longer accepting writes.';
END;
$$;

DROP TRIGGER IF EXISTS block_event_bookings_insert ON public.event_bookings;
CREATE TRIGGER block_event_bookings_insert
  BEFORE INSERT OR UPDATE ON public.event_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.block_deprecated_event_bookings();

-- Block INSERT/UPDATE on property_bookings
CREATE OR REPLACE FUNCTION public.block_deprecated_property_bookings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Deprecated — use orders table. property_bookings is no longer accepting writes.';
END;
$$;

DROP TRIGGER IF EXISTS block_property_bookings_insert ON public.property_bookings;
CREATE TRIGGER block_property_bookings_insert
  BEFORE INSERT OR UPDATE ON public.property_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.block_deprecated_property_bookings();

-- Block INSERT/UPDATE on water_activity_bookings
CREATE OR REPLACE FUNCTION public.block_deprecated_water_bookings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Deprecated — use orders table. water_activity_bookings is no longer accepting writes.';
END;
$$;

DROP TRIGGER IF EXISTS block_water_bookings_insert ON public.water_activity_bookings;
CREATE TRIGGER block_water_bookings_insert
  BEFORE INSERT OR UPDATE ON public.water_activity_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.block_deprecated_water_bookings();


-- =====================================================
-- P0 FIX: STRENGTHEN RLS POLICIES
-- =====================================================

-- Admin access to orders (full CRUD)
DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
CREATE POLICY "Admins have full access to orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Owner access to orders (via resource_id in order_items linked to resources.org_id)
DROP POLICY IF EXISTS "Owners view orders with owned resources" ON public.orders;
CREATE POLICY "Owners view orders with owned resources"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN resources r ON r.id = oi.resource_id
      JOIN org_members om ON om.org_id = r.org_id
      WHERE oi.order_id = orders.id
        AND om.user_id = auth.uid()
    )
  );

-- Vendor update access
DROP POLICY IF EXISTS "Vendors can update own org orders" ON public.orders;
CREATE POLICY "Vendors can update own org orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    provider_org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Admin access to order_items
DROP POLICY IF EXISTS "Admins have full access to order_items" ON public.order_items;
CREATE POLICY "Admins have full access to order_items"
  ON public.order_items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Vendor access to own org order items
DROP POLICY IF EXISTS "Vendors view own org order items" ON public.order_items;
CREATE POLICY "Vendors view own org order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    provider_org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Owner access to order items with owned resources
DROP POLICY IF EXISTS "Owners view order items with owned resources" ON public.order_items;
CREATE POLICY "Owners view order items with owned resources"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    resource_id IN (
      SELECT r.id FROM resources r
      JOIN org_members om ON om.org_id = r.org_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Admin access to payment_intents
DROP POLICY IF EXISTS "Admins have full access to payment_intents" ON public.payment_intents;
CREATE POLICY "Admins have full access to payment_intents"
  ON public.payment_intents FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin access to ledger_accounts
DROP POLICY IF EXISTS "Admins have full access to ledger_accounts" ON public.ledger_accounts;
CREATE POLICY "Admins have full access to ledger_accounts"
  ON public.ledger_accounts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin access to ledger_entries  
DROP POLICY IF EXISTS "Admins have full access to ledger_entries" ON public.ledger_entries;
CREATE POLICY "Admins have full access to ledger_entries"
  ON public.ledger_entries FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Vendors view their org's ledger entries
DROP POLICY IF EXISTS "Vendors view org ledger entries" ON public.ledger_entries;
CREATE POLICY "Vendors view org ledger entries"
  ON public.ledger_entries FOR SELECT
  TO authenticated
  USING (
    credit_account_id IN (
      SELECT la.id FROM ledger_accounts la
      JOIN org_members om ON om.org_id = la.owner_org_id
      WHERE om.user_id = auth.uid()
    )
    OR
    debit_account_id IN (
      SELECT la.id FROM ledger_accounts la
      JOIN org_members om ON om.org_id = la.owner_org_id
      WHERE om.user_id = auth.uid()
    )
  );