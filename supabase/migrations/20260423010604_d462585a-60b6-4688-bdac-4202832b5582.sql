-- M5 Hardening H.1: anon→user backfill on signup
-- Extend handle_new_user() to claim anonymous concierge_sessions and persona_detection_log
-- when frontend passes anon_session_id in raw_user_meta_data on signUp.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_anon_id text;
  v_last_proposal jsonb;
BEGIN
  -- 1. Create profile (idempotent)
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.phone, '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Assign default 'user' role (idempotent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 3. Anon → user backfill (M5 H.1)
  v_anon_id := NULLIF(NEW.raw_user_meta_data ->> 'anon_session_id', '');

  IF v_anon_id IS NOT NULL THEN
    -- 3a. Claim anonymous concierge_sessions
    UPDATE public.concierge_sessions
       SET user_id = NEW.id
     WHERE anon_session_id = v_anon_id
       AND user_id IS NULL;

    -- 3b. Claim anonymous persona_detection_log entries
    UPDATE public.persona_detection_log
       SET user_id = NEW.id
     WHERE anon_session_id = v_anon_id
       AND user_id IS NULL;

    -- 3c. Pull the most recent proposal for this anon session
    --     and merge canonical columns into profiles (only if still empty,
    --     so we never overwrite a user-supplied value).
    SELECT proposal
      INTO v_last_proposal
      FROM public.persona_detection_log
     WHERE user_id = NEW.id
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
                 ARRAY(
                   SELECT jsonb_array_elements_text(v_last_proposal -> 'active_clusters')
                 ),
                 active_clusters
               )
             ELSE active_clusters
           END,
           special_status = CASE
             WHEN (special_status IS NULL OR cardinality(special_status) = 0)
               AND v_last_proposal ? 'triggers'
               THEN COALESCE(
                 ARRAY(
                   SELECT jsonb_array_elements_text(v_last_proposal -> 'triggers')
                 ),
                 special_status
               )
             ELSE special_status
           END
       WHERE id = NEW.id;

      -- Mark the most recent log entry as applied for audit clarity
      UPDATE public.persona_detection_log
         SET applied = true
       WHERE user_id = NEW.id
         AND created_at = (
           SELECT MAX(created_at)
             FROM public.persona_detection_log
            WHERE user_id = NEW.id
         );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let backfill failures block signup. Log and continue.
  RAISE WARNING 'handle_new_user backfill failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;