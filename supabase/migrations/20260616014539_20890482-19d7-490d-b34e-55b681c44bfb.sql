-- Bulk-disable dead AI agents: active=true, but no published knowledge AND zero call history.
-- Keeps data, only flips is_active=false so admin UI honestly reflects state.
UPDATE public.ai_agents a
SET is_active = false, updated_at = now()
WHERE a.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.ai_agent_knowledge k
    WHERE k.agent_id = a.id AND k.is_published = true
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.ai_agent_logs l WHERE l.agent_id = a.id
  );