-- Drop the broken RLS policy that causes infinite recursion
-- The policy "Owners view order items with owned resources" references columns that don't exist
DROP POLICY IF EXISTS "Owners view order items with owned resources" ON public.order_items;

-- The existing policies are sufficient:
-- 1. "View order items via order" - allows viewing through orders relationship
-- 2. "Vendors view own org order items" - allows vendors to see their orders
-- 3. "Admins have full access" - admin override
-- 4. "Create order items" - allows creating items for own orders