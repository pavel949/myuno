-- Добавляем гибкие настройки оплаты в owner_properties
ALTER TABLE owner_properties
  ADD COLUMN IF NOT EXISTS payment_model text DEFAULT 'full_prepay',
  ADD COLUMN IF NOT EXISTS prepay_percent integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS balance_due_days integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS security_deposit_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS security_deposit_collection text DEFAULT 'at_checkin';

-- Этапы оплаты для каждого заказа
CREATE TABLE IF NOT EXISTS order_payment_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stage_type text NOT NULL CHECK (stage_type IN ('deposit', 'balance', 'security_deposit')),
  amount numeric NOT NULL,
  currency text DEFAULT 'THB',
  due_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'waived', 'overdue')),
  payment_intent_id UUID REFERENCES payment_intents(id),
  paid_at timestamp with time zone,
  refunded_at timestamp with time zone,
  refund_amount numeric,
  notes text,
  reminder_sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_payment_stages_order ON order_payment_stages(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_stages_due_status ON order_payment_stages(due_date, status);
CREATE INDEX IF NOT EXISTS idx_payment_stages_status ON order_payment_stages(status);

-- Enable RLS
ALTER TABLE order_payment_stages ENABLE ROW LEVEL SECURITY;

-- Политики RLS для гостей
CREATE POLICY "Users can view own payment stages"
ON order_payment_stages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_payment_stages.order_id
    AND o.customer_user_id = auth.uid()
  )
);

-- Политика для владельцев через metadata (используем owner_id)
CREATE POLICY "Owners can view payment stages for their properties"
ON order_payment_stages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN owner_properties op ON (o.metadata->>'property_id')::uuid = op.id
    WHERE o.id = order_payment_stages.order_id
    AND op.owner_id = auth.uid()
  )
);

-- Политика для owners на update (возврат залога)
CREATE POLICY "Owners can update payment stages for their properties"
ON order_payment_stages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN owner_properties op ON (o.metadata->>'property_id')::uuid = op.id
    WHERE o.id = order_payment_stages.order_id
    AND op.owner_id = auth.uid()
  )
);

-- System policies
CREATE POLICY "System can insert payment stages"
ON order_payment_stages FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update payment stages"
ON order_payment_stages FOR UPDATE
USING (true);

-- Trigger для updated_at
CREATE OR REPLACE FUNCTION update_payment_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_stages_timestamp
  BEFORE UPDATE ON order_payment_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_stages_updated_at();