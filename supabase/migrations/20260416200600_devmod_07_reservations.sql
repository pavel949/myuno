-- =============================================================
-- Developer Module | Migration 07: reservations + payment_schedules
--
-- A reservation is created when a buyer pays the booking fee.
-- payment_schedules tracks the instalment plan generated from the
-- project's payment_plan_template.
-- Reservation number format: RES-YYYY-NNNNN
-- =============================================================

-- -------------------------------------------------------------
-- 1. reservations
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reservations (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id                  uuid        NOT NULL REFERENCES public.project_units(id),
  buyer_id                 uuid        NOT NULL REFERENCES public.buyers(id),
  hold_id                  uuid        REFERENCES public.unit_holds(id),
  project_id               uuid        NOT NULL REFERENCES public.property_projects(id),
  developer_id             uuid        NOT NULL REFERENCES public.developers(id),
  reservation_number       text        UNIQUE NOT NULL,    -- RES-2026-00001
  deposit_amount_thb       numeric     NOT NULL,
  deposit_paid_at          timestamptz,
  deposit_stripe_pi_id     text,
  reservation_fee_status   text        DEFAULT 'pending'
    CHECK (reservation_fee_status IN ('pending','paid','refunded')),
  agreed_price_thb         numeric     NOT NULL,
  discount_pct             numeric     DEFAULT 0,
  discount_approved_by     uuid,
  spa_signed_at            timestamptz,
  spa_document_url         text,
  handover_target_date     date,
  handover_actual_date     date,
  transfer_completed_at    timestamptz,
  status                   text        DEFAULT 'reserved'
    CHECK (status IN ('reserved','spa_signed','payments_in_progress','handover_scheduled','completed','cancelled')),
  cancellation_reason      text,
  created_by_user_id       uuid,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devmod_reservations_unit
  ON public.reservations(unit_id);

CREATE INDEX IF NOT EXISTS idx_devmod_reservations_buyer
  ON public.reservations(buyer_id);

CREATE INDEX IF NOT EXISTS idx_devmod_reservations_project_status
  ON public.reservations(project_id, status);

CREATE INDEX IF NOT EXISTS idx_devmod_reservations_developer_status
  ON public.reservations(developer_id, status);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER devmod_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------
-- 2. payment_schedules
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.payment_schedules (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  uuid        NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  milestone       text        NOT NULL,   -- 'booking_fee','spa_30pct','construction_25pct','finishing_25pct','handover_balance'
  milestone_order integer     NOT NULL,
  due_date        date,
  amount_thb      numeric     NOT NULL,
  amount_pct      numeric,
  paid_date       date,
  paid_amount_thb numeric,
  receipt_url     text,
  status          text        DEFAULT 'pending'
    CHECK (status IN ('pending','due_soon','overdue','paid','waived')),
  notes           text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devmod_payment_schedules_reservation
  ON public.payment_schedules(reservation_id, milestone_order);

CREATE INDEX IF NOT EXISTS idx_devmod_payment_schedules_due
  ON public.payment_schedules(status, due_date)
  WHERE status IN ('pending','due_soon','overdue');

ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;

-- Sequence for reservation numbering
CREATE SEQUENCE IF NOT EXISTS devmod_reservation_seq START 1;

-- Function to generate RES-YYYY-NNNNN
CREATE OR REPLACE FUNCTION public.devmod_next_reservation_number()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'RES-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('devmod_reservation_seq')::text, 5, '0')
$$;
