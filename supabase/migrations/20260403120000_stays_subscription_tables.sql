-- STAYS: subscription tiers and per-property subscriptions (Stripe)

CREATE TABLE stays_subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  price_thb_monthly int4 NOT NULL,
  stripe_price_id text,
  max_ota_links int2,
  dynamic_pricing bool DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE property_stays_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  tier_id uuid REFERENCES stays_subscription_tiers(id),
  stripe_subscription_id text,
  stripe_customer_id text,
  status text DEFAULT 'trialing',
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT property_stays_subscriptions_one_row_per_property UNIQUE (property_id)
);

CREATE INDEX idx_property_stays_subscriptions_owner_id ON property_stays_subscriptions(owner_id);
CREATE INDEX idx_property_stays_subscriptions_stripe_sub ON property_stays_subscriptions(stripe_subscription_id);

ALTER TABLE stays_subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_stays_subscriptions ENABLE ROW LEVEL SECURITY;

-- Tiers are readable by any authenticated user (checkout UI)
CREATE POLICY "Authenticated users can read stays tiers"
  ON stays_subscription_tiers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owner manages own stays subscriptions"
  ON property_stays_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

INSERT INTO stays_subscription_tiers (code, name, price_thb_monthly, max_ota_links, dynamic_pricing)
VALUES
  ('starter', 'Starter', 499, 2, false),
  ('growth', 'Growth', 799, 5, true),
  ('pro', 'Pro', 1499, 999, true);
