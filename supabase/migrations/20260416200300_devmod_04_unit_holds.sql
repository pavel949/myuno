-- =============================================================
-- Developer Module | Migration 04: unit_holds
--
-- Unit holds implement the soft / hard blocking state machine.
-- A soft_hold reserves a unit for 30 minutes (no payment).
-- booking_fee / reservation / spa_signed are paid or signed stages.
-- Cron job (devmod_release_expired_holds function) releases expired
-- soft holds automatically.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.unit_holds (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id                   uuid        NOT NULL REFERENCES public.project_units(id),
  lead_id                   uuid        REFERENCES public.nb_leads(id),
  buyer_id                  uuid,                              -- references buyers(id), FK added in migration 06
  hold_type                 text        NOT NULL
    CHECK (hold_type IN ('soft_hold','booking_fee','reservation','spa_signed')),
  fee_amount_thb            numeric     DEFAULT 0,
  fee_status                text        DEFAULT 'none'
    CHECK (fee_status IN ('none','pending','paid','refunded','forfeited')),
  stripe_payment_intent_id  text,
  expires_at                timestamptz,
  created_by_user_id        uuid,
  notes                     text,
  created_at                timestamptz DEFAULT now(),
  released_at               timestamptz,
  released_reason           text
);

-- Active holds by unit (most common lookup: "is unit currently held?")
CREATE INDEX IF NOT EXISTS idx_devmod_unit_holds_unit_active
  ON public.unit_holds(unit_id, hold_type, released_at);

-- Cron index: find all expired unreleased holds
CREATE INDEX IF NOT EXISTS idx_devmod_unit_holds_expires
  ON public.unit_holds(expires_at)
  WHERE released_at IS NULL;

ALTER TABLE public.unit_holds ENABLE ROW LEVEL SECURITY;
