-- Fix infinite recursion in RLS policies for orders/order_items
-- Problem: orders policy joins order_items, and order_items policy subqueries orders

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Owners view orders with owned resources" ON public.orders;

-- Create a safer version that doesn't cause recursion
-- Instead of joining through order_items, we check provider_org_id directly
-- (Owners see orders if they are members of the provider org)
CREATE POLICY "Owners view orders via org membership"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = orders.provider_org_id
    AND org_members.user_id = auth.uid()
  )
);

-- Note: "Vendors view org orders" policy already covers this case,
-- but keeping this for owners who may have different org roles