-- M5 H.7 — OAuth anon→user backfill
-- The handle_new_user() trigger reads anon_session_id from raw_user_meta_data,
-- which is only set on email signup. OAuth (Google/Apple) flows don't pass
-- it through, so we expose an idempotent RPC the client calls right after
-- the first SIGNED_IN event.

CREATE OR REPLACE FUNCTION public.claim_anon_session(p_anon_session_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_last_proposal jsonb;
BEGIN
  IF v_user IS NULL OR p_anon_session_id IS NULL OR length(trim(p_anon_session_id)) = 0 THEN
    RETURN;
  END IF;

  UPDATE public.concierge_sessions
     SET user_id = v_user
   WHERE anon_session_id = p_anon_session_id
     AND user_id IS NULL;

  UPDATE public.persona_detection_log
     SET user_id = v_user
   WHERE anon_session_id = p_anon_session_id
     AND user_id IS NULL;

  SELECT proposal
    INTO v_last_proposal
    FROM public.persona_detection_log
   WHERE user_id = v_user
     AND proposal IS NOT NULL
   ORDER BY created_at DESC
   LIMIT 1;

  IF v_last_proposal IS NOT NULL THEN
    UPDATE public.profiles
       SET
         lifecycle_stage = COALESCE(
           lifecycle_stage,
           NULLIF(v_last_proposal ->> 'lifecycle_stage', '')
         ),
         detected_persona = COALESCE(
           detected_persona,
           NULLIF(v_last_proposal ->> 'detected_persona', '')
         ),
         active_clusters = CASE
           WHEN active_clusters IS NULL OR cardinality(active_clusters) = 0
             THEN COALESCE(
               ARRAY(SELECT jsonb_array_elements_text(v_last_proposal -> 'active_clusters')),
               active_clusters
             )
           ELSE active_clusters
         END,
         special_status = CASE
           WHEN (special_status IS NULL OR cardinality(special_status) = 0)
             AND v_last_proposal ? 'triggers'
             THEN COALESCE(
               ARRAY(SELECT jsonb_array_elements_text(v_last_proposal -> 'triggers')),
               special_status
             )
           ELSE special_status
         END
     WHERE id = v_user;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'claim_anon_session failed for %: %', v_user, SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_anon_session(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_anon_session(text) TO authenticated;