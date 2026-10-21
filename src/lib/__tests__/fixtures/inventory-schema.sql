-- Minimal isolated PostgreSQL fixture, never a production migration or app backend.
CREATE EXTENSION btree_gist;
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role;
CREATE TABLE properties (id uuid PRIMARY KEY, owner_id uuid, room_category_id uuid, is_active boolean, unit_number text);
CREATE TABLE property_availability (property_id uuid, date date, status text);
CREATE TABLE property_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), property_id uuid, owner_id uuid,
  guest_name text, guest_phone text, guest_email text, guests_count int,
  check_in date, check_out date, total_amount numeric, currency text, source text,
  external_id text UNIQUE, order_id uuid, status text, notes text, deposit_amount numeric,
  created_at timestamptz, updated_at timestamptz
);
-- Exact predicate and half-open range verified on live production 2026-10-17.
ALTER TABLE property_bookings ADD CONSTRAINT property_bookings_no_overlap
  EXCLUDE USING gist (property_id WITH =, daterange(check_in, check_out, '[)') WITH &&)
  WHERE (status NOT IN ('cancelled','rejected','expired'));
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_number text DEFAULT 'TEST',
  order_type text, vertical text DEFAULT 'property', customer_user_id uuid, provider_org_id uuid,
  status text, start_at timestamptz, end_at timestamptz, total_amount numeric, currency text,
  notes text, metadata jsonb, deleted_at timestamptz,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE order_items (
  order_id uuid, product_id uuid, resource_id uuid, provider_org_id uuid,
  item_name text, item_type text, qty int, unit_price numeric, amount numeric,
  start_at timestamptz, end_at timestamptz, metadata jsonb
);
CREATE TABLE order_participants (order_id uuid, role text, name text, phone text, email text);
CREATE TABLE order_addresses (order_id uuid, address_type text, address_text text, lat numeric, lng numeric, notes text);
CREATE TYPE payment_method AS ENUM ('stripe');
CREATE TABLE payment_intents (order_id uuid, amount numeric, currency text, method payment_method, status text);
CREATE TABLE order_status_history (order_id uuid, from_status text, to_status text, actor_user_id uuid, reason text);
CREATE TABLE reconciliation_alerts (
  alert_type text, severity text, order_id uuid, expected_amount numeric, currency text,
  description text, details jsonb, resolved_at timestamptz
);
-- Production item trigger performs the same no-op order touch to reuse sync.
CREATE FUNCTION trg_sync_order_item_to_property_booking() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.item_type <> 'property' THEN RETURN NEW; END IF;
  UPDATE orders SET updated_at = now() WHERE id = NEW.order_id;
  RETURN NEW;
END $$;
CREATE TRIGGER sync_order_item_to_property_booking AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION trg_sync_order_item_to_property_booking();
