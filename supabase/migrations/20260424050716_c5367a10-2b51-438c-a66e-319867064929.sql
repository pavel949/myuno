
-- ============================================================================
-- Stage 4: Unified Outreach Layer
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) outreach_templates — единая таблица шаблонов
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.outreach_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_type text NOT NULL CHECK (audience_type IN ('vendor','investor','guest','owner','mcc_lead','custom')),
  channel text NOT NULL CHECK (channel IN ('email','whatsapp','telegram','sms','instagram_dm')),
  language text NOT NULL DEFAULT 'ru' CHECK (language IN ('ru','en','th')),
  stage text NOT NULL DEFAULT 'initial',
  name text NOT NULL,
  subject text,
  body text NOT NULL,
  variables text[] DEFAULT '{}',
  business_type text,
  company_id uuid REFERENCES public.management_companies(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  source_table text,
  source_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_templates_audience ON public.outreach_templates(audience_type, is_active);
CREATE INDEX IF NOT EXISTS idx_outreach_templates_company ON public.outreach_templates(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outreach_templates_source ON public.outreach_templates(source_table, source_id) WHERE source_table IS NOT NULL;

ALTER TABLE public.outreach_templates ENABLE ROW LEVEL SECURITY;

-- Admins manage everything
CREATE POLICY "outreach_templates_admin_all"
  ON public.outreach_templates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- MC members can read/write their own + global (company_id IS NULL)
CREATE POLICY "outreach_templates_mc_read"
  ON public.outreach_templates FOR SELECT
  TO authenticated
  USING (
    company_id IS NULL
    OR company_id IN (
      SELECT mcm.company_id FROM public.management_company_members mcm
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );

CREATE POLICY "outreach_templates_mc_write"
  ON public.outreach_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT mcm.company_id FROM public.management_company_members mcm
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );

CREATE POLICY "outreach_templates_mc_update"
  ON public.outreach_templates FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT mcm.company_id FROM public.management_company_members mcm
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );

CREATE TRIGGER trg_outreach_templates_updated
  BEFORE UPDATE ON public.outreach_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 2) outreach_messages — единый лог исходящих сообщений
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.outreach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid REFERENCES public.contact_identities(id) ON DELETE SET NULL,
  audience_type text NOT NULL CHECK (audience_type IN ('vendor','investor','guest','owner','mcc_lead','custom')),
  channel text NOT NULL CHECK (channel IN ('email','whatsapp','telegram','sms','instagram_dm')),
  template_id uuid REFERENCES public.outreach_templates(id) ON DELETE SET NULL,
  campaign_source text CHECK (campaign_source IN ('capital_campaigns','mcc_campaigns','crm_sequences') OR campaign_source IS NULL),
  campaign_source_id uuid,
  to_address text,
  subject text,
  body text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sending','sent','delivered','opened','clicked','replied','failed','bounced')),
  followup_sequence integer NOT NULL DEFAULT 0,
  next_followup_at timestamptz,
  scheduled_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  response_type text CHECK (response_type IN ('interested','not_now','declined','no_response') OR response_type IS NULL),
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  source_table text,
  source_id uuid,
  created_by uuid,
  company_id uuid REFERENCES public.management_companies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_messages_identity ON public.outreach_messages(identity_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_audience_status ON public.outreach_messages(audience_type, status);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_followup ON public.outreach_messages(next_followup_at) WHERE status IN ('sent','delivered');
CREATE INDEX IF NOT EXISTS idx_outreach_messages_campaign ON public.outreach_messages(campaign_source, campaign_source_id) WHERE campaign_source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outreach_messages_created ON public.outreach_messages(created_at DESC);

ALTER TABLE public.outreach_messages ENABLE ROW LEVEL SECURITY;

-- Admins see everything
CREATE POLICY "outreach_messages_admin_all"
  ON public.outreach_messages FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authors see their own
CREATE POLICY "outreach_messages_author"
  ON public.outreach_messages FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "outreach_messages_author_insert"
  ON public.outreach_messages FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "outreach_messages_author_update"
  ON public.outreach_messages FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- MC members see messages tied to their company
CREATE POLICY "outreach_messages_mc_read"
  ON public.outreach_messages FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL AND company_id IN (
      SELECT mcm.company_id FROM public.management_company_members mcm
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );

CREATE TRIGGER trg_outreach_messages_updated
  BEFORE UPDATE ON public.outreach_messages
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 3) Throttle function — антиспам guard
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.outreach_throttle_check(
  _identity_id uuid,
  _channel text,
  _window interval DEFAULT '24 hours'::interval
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.outreach_messages
    WHERE identity_id = _identity_id
      AND channel = _channel
      AND status IN ('queued','sending','sent','delivered','opened','clicked')
      AND created_at > now() - _window
  );
$$;

-- ----------------------------------------------------------------------------
-- 4) Sync trigger: vendor_outreach_templates -> outreach_templates
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_sync_vendor_outreach_templates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.outreach_templates
    WHERE source_table = 'vendor_outreach_templates' AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.outreach_templates (
    audience_type, channel, language, stage, name, subject, body,
    variables, business_type, is_active, source_table, source_id, created_by
  ) VALUES (
    'vendor', NEW.channel, NEW.language, NEW.stage, NEW.name, NEW.subject, NEW.template,
    NEW.variables, NEW.business_type, COALESCE(NEW.is_active, true),
    'vendor_outreach_templates', NEW.id, NEW.created_by
  )
  ON CONFLICT DO NOTHING;

  IF TG_OP = 'UPDATE' THEN
    UPDATE public.outreach_templates SET
      channel = NEW.channel,
      language = NEW.language,
      stage = NEW.stage,
      name = NEW.name,
      subject = NEW.subject,
      body = NEW.template,
      variables = NEW.variables,
      business_type = NEW.business_type,
      is_active = COALESCE(NEW.is_active, true),
      updated_at = now()
    WHERE source_table = 'vendor_outreach_templates' AND source_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_vendor_outreach_templates ON public.vendor_outreach_templates;
CREATE TRIGGER trg_sync_vendor_outreach_templates
  AFTER INSERT OR UPDATE OR DELETE ON public.vendor_outreach_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_sync_vendor_outreach_templates();

-- ----------------------------------------------------------------------------
-- 5) Backfill existing vendor templates
-- ----------------------------------------------------------------------------
INSERT INTO public.outreach_templates (
  audience_type, channel, language, stage, name, subject, body,
  variables, business_type, is_active, source_table, source_id, created_by
)
SELECT
  'vendor', vt.channel, vt.language, vt.stage, vt.name, vt.subject, vt.template,
  COALESCE(vt.variables, '{}'::text[]), vt.business_type, COALESCE(vt.is_active, true),
  'vendor_outreach_templates', vt.id, vt.created_by
FROM public.vendor_outreach_templates vt
WHERE NOT EXISTS (
  SELECT 1 FROM public.outreach_templates ot
  WHERE ot.source_table = 'vendor_outreach_templates' AND ot.source_id = vt.id
);

-- ----------------------------------------------------------------------------
-- 6) Backfill existing vendor outreach log -> outreach_messages
-- ----------------------------------------------------------------------------
INSERT INTO public.outreach_messages (
  identity_id, audience_type, channel, subject, body, status,
  followup_sequence, next_followup_at, sent_at, opened_at, clicked_at,
  error_message, metadata, source_table, source_id, created_at
)
SELECT
  cil.identity_id,
  'vendor',
  vol.channel,
  vol.subject,
  vol.message_body,
  CASE
    WHEN vol.status IN ('queued','sending','sent','delivered','opened','clicked','replied','failed','bounced')
      THEN vol.status
    WHEN vol.status = 'pending' THEN 'queued'
    WHEN vol.status = 'registered' THEN 'replied'
    ELSE 'sent'
  END,
  COALESCE(vol.followup_sequence, 0),
  vol.next_followup_at,
  vol.sent_at,
  vol.opened_at,
  vol.clicked_at,
  vol.error_message,
  jsonb_build_object(
    'invite_link', vol.invite_link,
    'ai_model', vol.ai_model,
    'ai_personalization_data', vol.ai_personalization_data,
    'registered_at', vol.registered_at
  ),
  'vendor_outreach_log',
  vol.id,
  vol.created_at
FROM public.vendor_outreach_log vol
LEFT JOIN public.contact_identity_links cil
  ON cil.source_table = 'crm_contacts' AND cil.source_id = vol.contact_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.outreach_messages om
  WHERE om.source_table = 'vendor_outreach_log' AND om.source_id = vol.id
);

-- ----------------------------------------------------------------------------
-- 7) Unified campaigns view — три источника в одном списке
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_outreach_campaigns_unified
WITH (security_invoker = true)
AS
SELECT
  cc.id,
  cc.name,
  'capital_campaigns'::text AS campaign_source,
  cc.status,
  cc.type AS campaign_type,
  NULL::text AS goal,
  cc.user_id::text AS owner_id,
  NULL::uuid AS company_id,
  cc.created_at,
  cc.updated_at
FROM public.capital_campaigns cc
UNION ALL
SELECT
  mc.id,
  mc.name,
  'mcc_campaigns'::text,
  mc.status,
  NULL::text,
  mc.goal,
  mc.created_by::text,
  NULL::uuid,
  mc.created_at,
  mc.updated_at
FROM public.mcc_campaigns mc
UNION ALL
SELECT
  cs.id,
  cs.name,
  'crm_sequences'::text,
  CASE WHEN cs.is_active THEN 'active' ELSE 'paused' END,
  'sequence'::text,
  NULL::text,
  cs.created_by::text,
  cs.company_id,
  cs.created_at,
  cs.created_at
FROM public.crm_sequences cs;

-- ----------------------------------------------------------------------------
-- 8) Messages with identity view (admin convenience)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_outreach_messages_with_identity
WITH (security_invoker = true)
AS
SELECT
  om.id,
  om.identity_id,
  om.audience_type,
  om.channel,
  om.template_id,
  om.campaign_source,
  om.campaign_source_id,
  om.to_address,
  om.subject,
  om.status,
  om.followup_sequence,
  om.next_followup_at,
  om.sent_at,
  om.opened_at,
  om.clicked_at,
  om.replied_at,
  om.response_type,
  om.created_at,
  om.created_by,
  om.company_id,
  ci.display_name AS identity_name,
  ci.primary_email AS identity_email,
  ci.primary_phone AS identity_phone,
  ci.primary_user_id AS identity_user_id
FROM public.outreach_messages om
LEFT JOIN public.contact_identities ci ON ci.id = om.identity_id;
