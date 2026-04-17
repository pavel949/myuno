-- =============================================================
-- Developer Module | Migration 01: Extend developers + create developer_users
--
-- The `developers` table already exists in this project as a public catalog
-- of Phuket real estate developers. This migration extends it with the
-- fields required by the Developer Module (legal identity, Stripe Connect,
-- lifecycle status, verification audit trail) and creates the new
-- `developer_users` table for multi-seat developer organisations.
--
-- Nothing is dropped or renamed. All existing columns remain intact.
-- =============================================================

-- -------------------------------------------------------------
-- 1. EXTEND public.developers with Developer Module fields
-- -------------------------------------------------------------

ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS legal_name            text,
  ADD COLUMN IF NOT EXISTS display_name          text,
  ADD COLUMN IF NOT EXISTS registration_number   text,
  ADD COLUMN IF NOT EXISTS country               text DEFAULT 'TH',
  ADD COLUMN IF NOT EXISTS stripe_connect_id     text,
  ADD COLUMN IF NOT EXISTS devmod_status         text DEFAULT 'pending'
    CHECK (devmod_status IN ('pending','active','suspended','archived')),
  ADD COLUMN IF NOT EXISTS verified_at           timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by           uuid REFERENCES auth.users(id);

-- Backfill display_name / legal_name from existing name_en for legacy rows
UPDATE public.developers
SET
  display_name = COALESCE(display_name, name_en),
  legal_name   = COALESCE(legal_name,   name_en)
WHERE display_name IS NULL OR legal_name IS NULL;

-- Backfill devmod_status from existing is_active flag
UPDATE public.developers
SET devmod_status = CASE WHEN is_active THEN 'active' ELSE 'suspended' END
WHERE devmod_status = 'pending';

-- Sync verified_at for rows that were already verified
UPDATE public.developers
SET verified_at = created_at
WHERE is_verified = true AND verified_at IS NULL;

-- -------------------------------------------------------------
-- 2. CREATE developer_users — team members of a developer org
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.developer_users (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id       uuid        NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  auth_user_id       uuid        REFERENCES auth.users(id),
  email              text        NOT NULL,
  full_name          text,
  phone              text,
  role               text        NOT NULL
    CHECK (role IN ('owner','admin','sales_lead','sales_rep','finance','marketing','readonly')),
  project_access     uuid[]      DEFAULT '{}',
  invited_by         uuid        REFERENCES auth.users(id),
  invite_token       text        UNIQUE,
  invite_expires_at  timestamptz,
  status             text        DEFAULT 'invited'
    CHECK (status IN ('invited','active','disabled')),
  last_login_at      timestamptz,
  created_at         timestamptz DEFAULT now(),
  UNIQUE (developer_id, email)
);

CREATE INDEX IF NOT EXISTS idx_devmod_developer_users_dev_status
  ON public.developer_users(developer_id, status);

CREATE INDEX IF NOT EXISTS idx_devmod_developer_users_auth_user
  ON public.developer_users(auth_user_id);

-- Enable RLS (policies added in devmod_10_rls)
ALTER TABLE public.developer_users ENABLE ROW LEVEL SECURITY;
