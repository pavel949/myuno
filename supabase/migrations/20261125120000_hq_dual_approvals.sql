-- HQ Round 4A — two-person rule primitive.
--
-- Design Bible Round 4A (H1 ClearView editor, H2 payouts, H4 access) states:
-- "Money and ClearView approvals require two people. All changes logged."
-- One table + one RPC serve every surface instead of per-feature approval
-- columns. Rows are written only through SECURITY DEFINER RPCs so the
-- approver id is always auth.uid() and every approval lands in
-- admin_audit_logs.

CREATE TABLE IF NOT EXISTS public.hq_dual_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('payout_run', 'clearview_report')),
  entity_id TEXT NOT NULL CHECK (length(entity_id) BETWEEN 1 AND 200),
  approver_id UUID NOT NULL,
  note TEXT CHECK (note IS NULL OR length(note) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, approver_id)
);

CREATE INDEX IF NOT EXISTS idx_hq_dual_approvals_entity
  ON public.hq_dual_approvals (entity_type, entity_id);

ALTER TABLE public.hq_dual_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "HQ approvers read approvals" ON public.hq_dual_approvals;
CREATE POLICY "HQ approvers read approvals"
  ON public.hq_dual_approvals FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'finance'::public.app_role)
  );
-- No INSERT/UPDATE/DELETE policies: writes go through the RPCs below only.

-- Who may approve what. Mirrors src/lib/access/hqAccessPolicy.ts.
CREATE OR REPLACE FUNCTION public.hq_can_approve(_entity_type TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _entity_type
    WHEN 'payout_run' THEN
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'finance'::public.app_role)
    WHEN 'clearview_report' THEN
      public.has_role(auth.uid(), 'admin'::public.app_role)
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.hq_record_approval(
  _entity_type TEXT,
  _entity_id TEXT,
  _note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_count INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF NOT public.hq_can_approve(_entity_type) THEN
    RETURN json_build_object('success', false, 'error', 'Forbidden: approval role required');
  END IF;

  INSERT INTO public.hq_dual_approvals (entity_type, entity_id, approver_id, note)
  VALUES (_entity_type, _entity_id, v_uid, NULLIF(btrim(_note), ''))
  ON CONFLICT (entity_type, entity_id, approver_id)
  DO UPDATE SET created_at = now(), note = EXCLUDED.note;

  SELECT count(DISTINCT approver_id) INTO v_count
  FROM public.hq_dual_approvals
  WHERE entity_type = _entity_type AND entity_id = _entity_id;

  INSERT INTO public.admin_audit_logs (action, admin_id, entity_type, entity_id, new_data)
  VALUES ('hq_dual_approval', v_uid, _entity_type, _entity_id,
          jsonb_build_object('approvals', v_count, 'note', _note));

  RETURN json_build_object('success', true, 'approvals', v_count);
END;
$$;

-- Publishing a ClearView report is the money-equivalent decision for the
-- rating moat: it requires two distinct admin approvals given AFTER the
-- report's last edit (due_diligence_reports.updated_at is trigger-maintained),
-- so a sign-off never covers text changed after it was given.
CREATE OR REPLACE FUNCTION public.hq_publish_clearview_report(_report_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_count INTEGER;
BEGIN
  IF v_uid IS NULL OR NOT public.hq_can_approve('clearview_report') THEN
    RETURN json_build_object('success', false, 'error', 'Forbidden: admin role required');
  END IF;

  SELECT count(DISTINCT a.approver_id) INTO v_count
  FROM public.hq_dual_approvals a
  JOIN public.due_diligence_reports r ON r.id = _report_id
  WHERE a.entity_type = 'clearview_report'
    AND a.entity_id = _report_id::text
    AND a.created_at >= r.updated_at;

  IF v_count < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Two reviewers must approve before publishing', 'approvals', v_count);
  END IF;

  -- Transaction-local marker checked by the publish guard trigger below.
  PERFORM set_config('hq.clearview_publish', 'on', true);

  UPDATE public.due_diligence_reports
  SET is_published = true, reviewed_by = v_uid, reviewed_at = now(), updated_at = now()
  WHERE id = _report_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Report not found');
  END IF;

  INSERT INTO public.admin_audit_logs (action, admin_id, entity_type, entity_id, new_data)
  VALUES ('clearview_publish', v_uid, 'clearview_report', _report_id::text,
          jsonb_build_object('approvals', v_count));

  RETURN json_build_object('success', true, 'approvals', v_count);
END;
$$;

-- Publish guard: the pre-existing "Admins manage DD reports" FOR ALL policy
-- would otherwise let a single admin set is_published directly and skip the
-- two-person rule. Unpublishing stays direct (it reduces exposure).
CREATE OR REPLACE FUNCTION public.hq_guard_clearview_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_published IS TRUE
     AND (TG_OP = 'INSERT' OR OLD.is_published IS DISTINCT FROM TRUE)
     AND coalesce(current_setting('hq.clearview_publish', true), '') <> 'on' THEN
    RAISE EXCEPTION 'ClearView reports are published only through hq_publish_clearview_report (two reviewers)'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hq_guard_clearview_publish ON public.due_diligence_reports;
CREATE TRIGGER hq_guard_clearview_publish
  BEFORE INSERT OR UPDATE OF is_published ON public.due_diligence_reports
  FOR EACH ROW EXECUTE FUNCTION public.hq_guard_clearview_publish();

REVOKE ALL ON FUNCTION public.hq_record_approval(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hq_publish_clearview_report(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hq_can_approve(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hq_record_approval(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hq_publish_clearview_report(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hq_can_approve(TEXT) TO authenticated;

-- Kill-switch for the Round 4A HQ workspaces (admin-only tooling, ON by default).
INSERT INTO public.system_settings (key, value)
VALUES ('feature_flag:hq_round4a', '{"enabled": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
