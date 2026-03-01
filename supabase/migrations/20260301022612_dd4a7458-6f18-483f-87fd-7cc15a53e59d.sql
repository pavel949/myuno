
-- Owner Portal Settings: MC configures what property owner sees
CREATE TABLE public.owner_portal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.management_companies(id) ON DELETE CASCADE,
  
  -- Visibility toggles
  show_booking_calendar boolean NOT NULL DEFAULT true,
  show_guest_names boolean NOT NULL DEFAULT false,
  show_booking_prices boolean NOT NULL DEFAULT true,
  show_financial_statements boolean NOT NULL DEFAULT true,
  show_mc_commission boolean NOT NULL DEFAULT false,
  show_expenses_detail boolean NOT NULL DEFAULT true,
  show_maintenance boolean NOT NULL DEFAULT true,
  show_utilities boolean NOT NULL DEFAULT true,
  show_documents boolean NOT NULL DEFAULT true,
  show_owner_stays boolean NOT NULL DEFAULT false,
  show_occupancy_stats boolean NOT NULL DEFAULT true,
  show_deposits boolean NOT NULL DEFAULT true,
  show_payouts boolean NOT NULL DEFAULT true,
  
  -- Customization
  custom_welcome_message text,
  custom_welcome_message_ru text,
  statement_start_date date,
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(property_id, owner_user_id)
);

-- RLS
ALTER TABLE public.owner_portal_settings ENABLE ROW LEVEL SECURITY;

-- MC members can manage settings for their company's properties
CREATE POLICY "MC members manage portal settings"
  ON public.owner_portal_settings
  FOR ALL
  TO authenticated
  USING (
    public.is_mc_member_for_property(auth.uid(), property_id)
  )
  WITH CHECK (
    public.is_mc_member_for_property(auth.uid(), property_id)
  );

-- Property owners can read their own settings
CREATE POLICY "Owners read own portal settings"
  ON public.owner_portal_settings
  FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_owner_portal_settings_owner ON public.owner_portal_settings(owner_user_id);
CREATE INDEX idx_owner_portal_settings_property ON public.owner_portal_settings(property_id);
