-- RERE (Real Estate Revenue Engine) — rates and feature flags
-- All values in system_settings, read by useRevenueRates and edge functions

-- Helper: ensure system_settings row exists with given numeric value
DO $$
BEGIN
  -- 12 revenue rate keys
  -- Transaction commissions (percent)
  INSERT INTO public.system_settings (key, value, description) VALUES
    ('revenue:resale_commission', '3', 'Resale property commission, % of sale price (paid by seller, min ฿120,000)')
  ON CONFLICT (key) DO NOTHING;
  INSERT INTO public.system_settings (key, value, description) VALUES
    ('revenue:newbuild_commission', '6', 'New-build / off-plan commission, % of sale price (paid by developer)')
  ON CONFLICT (key) DO NOTHING;
  INSERT INTO public.system_settings (key, value, description) VALUES
    ('revenue:longterm_commission', '50', 'Long-term rent commission, % of first month (paid by landlord)')
  ON CONFLICT (key) DO NOTHING;
  INSERT INTO public.system_settings (key, value, description) VALUES
    ('revenue:str_guest_fee', '12', 'Short-term rental guest service fee, % of booking total')
  ON CONFLICT (key) DO NOTHING;
  INSERT INTO public.system_settings (key, value, description) VALUES
    ('revenue:str_host_fee', '3', 'Short-term rental host fee, % of booking total')
  ON CONFLICT (key) DO NOTHING;
  INSERT INTO public.system_settings (key, value, description) VALUES
    ('revenue:investment_deal_fee', '2', 'Investment deal fee for $200K+ transactions, % (paid by buyer)')
  ON CONFLICT (key) DO NOTHING;
  INSERT INTO public.system_settings (key, value, description) VALUES
    ('revenue:escrow_fee', '0.5', 'Escrow service fee, % of deal value')
  ON CONFLICT (key) DO NOTHING;

  -- Trust services (fixed THB amounts)
  INSERT INTO public.system_settings (key, value, description) VALUES
    ('revenue:trust_clearview', '120000', 'ClearView project rating fee, THB (paid by developer, report public)')
  ON CONFLICT (key) DO NOTHING;
  INSERT INTO public.system_settings (key, value, description) VALUES
    ('revenue:trust_fairprice', '9900', 'Fair-price assessment fee, THB (paid by buyer)')
  ON CONFLICT (key) DO NOTHING;
  INSERT INTO public.system_settings (key, value, description) VALUES
    ('revenue:trust_roi', '14900', 'Investment ROI report fee, THB')
  ON CONFLICT (key) DO NOTHING;
  INSERT INTO public.system_settings (key, value, description) VALUES
    ('revenue:trust_duediligence', '35000', 'Legal due diligence fee, THB')
  ON CONFLICT (key) DO NOTHING;
  INSERT INTO public.system_settings (key, value, description) VALUES
    ('revenue:trust_worldcheck', '4900', 'WorldCheck KYC for $200K+ deals, THB')
  ON CONFLICT (key) DO NOTHING;

  -- Feature flags
  INSERT INTO public.system_settings (key, value, description) VALUES
    ('feature_flag:re_revenue_engine', 'true', 'Enable Real Estate Revenue Engine UI (RERE)')
  ON CONFLICT (key) DO NOTHING;
  INSERT INTO public.system_settings (key, value, description) VALUES
    ('feature_flag:trust_as_service', 'true', 'Enable Trust-as-a-Service paid verifications block')
  ON CONFLICT (key) DO NOTHING;
  INSERT INTO public.system_settings (key, value, description) VALUES
    ('feature_flag:lead_quality_engine', 'false', 'Enable Lead Quality Engine for developers (off until Y1 validation)')
  ON CONFLICT (key) DO NOTHING;
END $$;