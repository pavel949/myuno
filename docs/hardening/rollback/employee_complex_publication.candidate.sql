-- SOURCE CANDIDATE ONLY. Explicit rollout/rollback approval required.
-- Freeze checked workflow, retain data, metadata, audit, restrictive policies and
-- safe public catalogue. Never restore membership-only writes or raw public rows.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.create_managed_complex_checked(uuid,uuid,jsonb,boolean),
 public.save_managed_complex_draft_checked(uuid,timestamptz,jsonb,boolean),
 public.read_managed_complex_draft_checked(uuid),
 public.list_managed_complex_drafts_checked(uuid,integer,integer),
 public.list_managed_complex_submissions_checked(uuid,integer,integer),
 public.review_managed_complex_submission_checked(uuid,timestamptz,text,text) FROM authenticated;
COMMIT;
