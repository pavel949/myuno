
CREATE TABLE public.deposit_vaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_address text NOT NULL,
  landlord_name text,
  landlord_contact text,
  deposit_amount_thb numeric(12,2),
  checkin_at timestamptz,
  checkout_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deposit_vaults TO authenticated;
GRANT ALL ON public.deposit_vaults TO service_role;
ALTER TABLE public.deposit_vaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their vault" ON public.deposit_vaults
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.deposit_vault_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id uuid NOT NULL REFERENCES public.deposit_vaults(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  phase text NOT NULL DEFAULT 'checkin',
  label text,
  taken_at timestamptz NOT NULL DEFAULT now(),
  lat double precision,
  lng double precision,
  exif jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deposit_vault_photos TO authenticated;
GRANT ALL ON public.deposit_vault_photos TO service_role;
ALTER TABLE public.deposit_vault_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their vault photos" ON public.deposit_vault_photos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX deposit_vault_photos_vault_idx ON public.deposit_vault_photos(vault_id);

CREATE TABLE public.dispute_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id uuid REFERENCES public.deposit_vaults(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  language text NOT NULL DEFAULT 'ru',
  deposit_amount_thb numeric(12,2),
  landlord_name text,
  landlord_contact text,
  complaint_summary text,
  letter_text text,
  letter_storage_path text,
  letter_generated_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispute_packs TO authenticated;
GRANT ALL ON public.dispute_packs TO service_role;
ALTER TABLE public.dispute_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their dispute packs" ON public.dispute_packs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX dispute_packs_user_idx ON public.dispute_packs(user_id);

CREATE TRIGGER deposit_vaults_updated_at BEFORE UPDATE ON public.deposit_vaults
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER dispute_packs_updated_at BEFORE UPDATE ON public.dispute_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.system_settings (key, value, description)
VALUES ('feature_flag:trust_stack_deposit_vault', 'true'::jsonb, 'Trust Stack §3 A-3 Deposit Vault + Dispute Pack')
ON CONFLICT (key) DO NOTHING;
