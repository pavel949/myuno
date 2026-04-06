-- ============================================================
-- CRITICAL BACKEND FIXES — Apply to production Supabase project
-- Project: kakkwibljrjsawxgnupk
-- Date: 2026-04-06
-- ============================================================

-- FIX 1: Add paid_at column to orders table
-- Without this, Stripe webhook can't record when payment was received
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- FIX 2: Auto-assign 'user' role on signup
-- Without this, new users have no role and role-based access fails
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_roles'
  ) THEN
    CREATE TRIGGER on_auth_user_created_roles
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user_role();
  END IF;
END;
$$;

-- FIX 3: Index on orders.paid_at for payment reporting queries
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON public.orders (paid_at) WHERE paid_at IS NOT NULL;
