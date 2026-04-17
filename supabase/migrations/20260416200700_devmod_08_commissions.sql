-- =============================================================
-- Developer Module | Migration 08: commission_agreements + commission_events
--
-- commission_agreements stores the commercial terms negotiated with
-- each developer (or per-project overrides).
-- commission_events is the double-entry ledger: earned → invoiced →
-- due → paid → reconciled.
-- Per spec R3: commission rate is individual per developer and stored here.
-- Per spec R5: all payments flow through Stripe Connect escrow.
-- =============================================================

-- -------------------------------------------------------------
-- 1. commission_agreements
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.commission_agreements (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id              uuid        NOT NULL REFERENCES public.developers(id),
  project_id                uuid        REFERENCES public.property_projects(id),  -- NULL = all projects of developer
  effective_from            date        NOT NULL,
  effective_to              date,
  developer_stated_rate     numeric     NOT NULL,    -- rate developer publicly states (e.g. 5%)
  myuno_retained_rate       numeric     NOT NULL,    -- rate myUNO keeps after sub-agent split
  sub_agent_split           numeric     DEFAULT 0,   -- portion split to sub-agents
  minimum_commission_thb    numeric,
  payment_trigger           text
    CHECK (payment_trigger IN ('on_spa','on_30pct','50_50','on_handover','on_transfer')),
  lead_ownership_days       integer     DEFAULT 365,
  price_parity_enforced     boolean     DEFAULT true,
  exclusive_russian_channel boolean     DEFAULT false,
  mou_document_url          text,
  status                    text        DEFAULT 'draft'
    CHECK (status IN ('draft','active','expired','terminated')),
  signed_by_broker_at       timestamptz,
  signed_by_developer_at    timestamptz,
  created_at                timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devmod_commission_agreements_developer
  ON public.commission_agreements(developer_id, status);

CREATE INDEX IF NOT EXISTS idx_devmod_commission_agreements_project
  ON public.commission_agreements(project_id, status);

ALTER TABLE public.commission_agreements ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 2. commission_events — ledger
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.commission_events (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id        uuid        NOT NULL REFERENCES public.reservations(id),
  agreement_id          uuid        NOT NULL REFERENCES public.commission_agreements(id),
  event_type            text        NOT NULL
    CHECK (event_type IN ('earned','invoiced','due','paid','reconciled','disputed','written_off')),
  gross_sale_price_thb  numeric     NOT NULL,
  commission_amount_thb numeric     NOT NULL,
  commission_rate       numeric     NOT NULL,
  invoice_number        text,
  invoice_url           text,
  paid_amount_thb       numeric,
  paid_at               timestamptz,
  dispute_reason        text,
  dispute_evidence      jsonb,
  notes                 text,
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devmod_commission_events_reservation
  ON public.commission_events(reservation_id);

CREATE INDEX IF NOT EXISTS idx_devmod_commission_events_type_date
  ON public.commission_events(event_type, created_at);

ALTER TABLE public.commission_events ENABLE ROW LEVEL SECURITY;
