-- ───────────────────────────────────────────────────────────────────────────
-- 1. project_units — drop overly permissive legacy policies
-- ───────────────────────────────────────────────────────────────────────────
-- Existing scoped policies that we KEEP (already in place):
--   * devmod: broker admin full access units            (ALL)
--   * devmod: developer manages own units               (ALL)
--   * devmod: public read units of listed projects      (SELECT)
-- Together they cover the full legitimate access matrix; the policies dropped
-- below are redundant duplicates that bypassed the developer scope check.

DROP POLICY IF EXISTS "Authenticated users can insert project_units" ON public.project_units;
DROP POLICY IF EXISTS "Authenticated users can read project_units"   ON public.project_units;
DROP POLICY IF EXISTS "Creators can delete project_units"            ON public.project_units;
DROP POLICY IF EXISTS "Creators can update project_units"            ON public.project_units;

-- Re-confirm RLS is on (no-op if already enabled).
ALTER TABLE public.project_units ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. realtime.messages — replace wide-open SELECT with scoped baseline
-- ───────────────────────────────────────────────────────────────────────────
-- Supabase Realtime authorisation reads RLS on `realtime.messages`. The legacy
-- "Allow listening for broadcasts for authenticated users only" policy with
-- `USING: true` lets any signed-in user subscribe to any channel topic and
-- receive every published row change.
--
-- Baseline rule introduced here:
--   * `user:<auth.uid()>`  — the user's own personal channel (1-to-1 push).
--   * `public:*`           — opt-in broadcast channels intended for everyone.
--
-- Anything else (orders, bookings, payments, support tickets, …) is denied by
-- default. Each feature that legitimately needs a private Realtime channel
-- must add its own SELECT policy on realtime.messages constrained by
-- realtime.topic() — this migration intentionally does not pre-grant them.

DROP POLICY IF EXISTS "Allow listening for broadcasts for authenticated users only"
  ON realtime.messages;
DROP POLICY IF EXISTS "Allow listening for broadcasts for all authenticated users"
  ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can subscribe to all"
  ON realtime.messages;

CREATE POLICY "Authenticated users subscribe to own + public channels"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = ('user:' || auth.uid()::text)
    OR realtime.topic() LIKE 'public:%'
  );
