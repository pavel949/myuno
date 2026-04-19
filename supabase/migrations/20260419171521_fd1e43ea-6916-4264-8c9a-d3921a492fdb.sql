-- ============ API KEYS ============
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read'],
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX idx_api_keys_company ON public.api_keys(company_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_api_keys_prefix ON public.api_keys(key_prefix);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MC members can view api keys"
ON public.api_keys FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = api_keys.company_id AND m.user_id = auth.uid() AND m.is_active = true
));

CREATE POLICY "MC admins can manage api keys"
ON public.api_keys FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = api_keys.company_id AND m.user_id = auth.uid()
    AND m.is_active = true AND m.role IN ('owner','admin')
));

-- ============ WEBHOOK ENDPOINTS ============
CREATE TABLE public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  description TEXT,
  events TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_webhook_endpoints_company ON public.webhook_endpoints(company_id);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MC members can view webhooks"
ON public.webhook_endpoints FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = webhook_endpoints.company_id AND m.user_id = auth.uid() AND m.is_active = true
));

CREATE POLICY "MC admins can manage webhooks"
ON public.webhook_endpoints FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = webhook_endpoints.company_id AND m.user_id = auth.uid()
    AND m.is_active = true AND m.role IN ('owner','admin')
));

-- ============ WEBHOOK DELIVERIES ============
CREATE TABLE public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_webhook_deliveries_endpoint ON public.webhook_deliveries(endpoint_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_pending ON public.webhook_deliveries(next_retry_at) WHERE delivered_at IS NULL;

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MC members can view webhook deliveries"
ON public.webhook_deliveries FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = webhook_deliveries.company_id AND m.user_id = auth.uid() AND m.is_active = true
));

-- ============ ONBOARDING PROGRESS ============
CREATE TABLE public.mc_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.management_companies(id) ON DELETE CASCADE,
  step_company_profile BOOLEAN NOT NULL DEFAULT false,
  step_team_invited BOOLEAN NOT NULL DEFAULT false,
  step_first_property BOOLEAN NOT NULL DEFAULT false,
  step_pricing_set BOOLEAN NOT NULL DEFAULT false,
  step_channel_connected BOOLEAN NOT NULL DEFAULT false,
  step_payment_method BOOLEAN NOT NULL DEFAULT false,
  step_first_booking BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mc_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MC members can view onboarding"
ON public.mc_onboarding_progress FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = mc_onboarding_progress.company_id AND m.user_id = auth.uid() AND m.is_active = true
));

CREATE POLICY "MC admins can manage onboarding"
ON public.mc_onboarding_progress FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = mc_onboarding_progress.company_id AND m.user_id = auth.uid()
    AND m.is_active = true AND m.role IN ('owner','admin')
));

-- ============ TRIGGERS ============
CREATE TRIGGER trg_webhook_endpoints_updated
BEFORE UPDATE ON public.webhook_endpoints
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_mc_onboarding_updated
BEFORE UPDATE ON public.mc_onboarding_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();