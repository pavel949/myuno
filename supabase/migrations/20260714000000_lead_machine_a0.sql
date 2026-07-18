-- Lead Machine · Phase A0 — sender-hardening support.
-- Additive + idempotent.

-- ── Conservative outbound defaults + escalation config ───────────────────────
-- outreach_daily_caps: per-channel per-UTC-day cap read by vendor-outreach-agent.
--   Seeded LOW (whatsapp 5) to warm the UltraMSG number; raise once healthy.
-- hot_lead_threshold: ai_score at/above which a lead escalates to the founder.
-- lead_escalation_whatsapp: override number for hot-lead alerts; empty → falls
--   back to getAdminWhatsApp() (_shared/admin-config.ts).
INSERT INTO public.system_settings (key, value, description) VALUES
  ('outreach_daily_caps', '{"whatsapp": 5, "email": 30}'::jsonb,
     'Lead machine: per-channel per-day outbound caps (warm-up values).'),
  ('hot_lead_threshold', '80'::jsonb,
     'Lead machine: ai_score >= this escalates a lead to the founder.'),
  ('lead_escalation_whatsapp', '""'::jsonb,
     'Lead machine: WhatsApp number for hot-lead alerts; empty → admin_whatsapp.')
ON CONFLICT (key) DO NOTHING;

-- ── lead_escalations — dedup ledger so each lead escalates to the founder once ──
CREATE TABLE IF NOT EXISTS public.lead_escalations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,          -- 'vendor_prospect' | 'owner_prospect' | 'consultation_request'
  entity_id   uuid NOT NULL,
  channel     text NOT NULL DEFAULT 'whatsapp',
  score       integer,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id)
);

ALTER TABLE public.lead_escalations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role manages lead escalations"
    ON public.lead_escalations FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can read lead escalations"
    ON public.lead_escalations FOR SELECT
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
