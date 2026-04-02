
CREATE OR REPLACE VIEW public.v_founder_inbox AS
SELECT * FROM (
  SELECT 
    id, 'task'::text as source_type, title, 
    COALESCE(priority, 'medium') as priority,
    status, due_date as target_date,
    company_id, created_at
  FROM public.crm_tasks
  WHERE status NOT IN ('done', 'cancelled')

  UNION ALL

  SELECT 
    id, 'deal'::text as source_type, client_name as title,
    CASE WHEN priority >= 8 THEN 'high' WHEN priority >= 5 THEN 'medium' ELSE 'low' END as priority,
    stage as status, next_action_date as target_date,
    company_id, created_at
  FROM public.agent_deals
  WHERE deal_status = 'active'

  UNION ALL

  SELECT
    id, 'prospect'::text as source_type, business_name as title,
    CASE WHEN ai_score >= 70 THEN 'high' WHEN ai_score >= 40 THEN 'medium' ELSE 'low' END as priority,
    status, next_followup_at as target_date,
    NULL::uuid as company_id, created_at
  FROM public.vendor_prospects
  WHERE status NOT IN ('won', 'lost', 'archived')
) sub
ORDER BY 
  CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
  target_date ASC NULLS LAST;
