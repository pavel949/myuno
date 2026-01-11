-- Auto-create wallet when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create wallet for new user with 0 balance
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'THB')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to create wallet after user creation
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();

-- Create wallets for existing users who don't have one
INSERT INTO public.wallets (user_id, balance, currency)
SELECT id, 0, 'THB'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.wallets WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;