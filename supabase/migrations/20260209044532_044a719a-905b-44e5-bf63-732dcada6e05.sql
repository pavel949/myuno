-- Fix: create_order_atomic must bypass RLS to insert into child tables
ALTER FUNCTION public.create_order_atomic(
  p_order_type text,
  p_customer_user_id uuid,
  p_provider_org_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_total_amount numeric,
  p_currency text,
  p_notes text,
  p_metadata jsonb,
  p_items jsonb,
  p_participants jsonb,
  p_addresses jsonb,
  p_payment_method text,
  p_payment_amount numeric
) SECURITY DEFINER SET search_path = public;

-- Also add INSERT policy for order_status_history as a safety net
CREATE POLICY "Users can insert status for own orders"
ON public.order_status_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_status_history.order_id
    AND orders.customer_user_id = auth.uid()
  )
);