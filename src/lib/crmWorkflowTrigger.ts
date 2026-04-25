/**
 * Fire CRM workflow triggers (non-blocking, fire-and-forget).
 * Used by deal/contact/activity mutations to execute automated workflows.
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type WorkflowTriggerType =
  | 'deal_created'
  | 'deal_stage_changed'
  | 'deal_won'
  | 'deal_lost'
  | 'contact_created'
  | 'contact_updated'
  | 'activity_logged';

interface TriggerPayload {
  trigger_type: WorkflowTriggerType;
  company_id: string;
  entity_id: string;
  entity_type: 'deal' | 'contact' | 'activity';
  metadata?: Record<string, unknown>;
}

/**
 * Fire a workflow trigger. Non-blocking — errors are logged but never thrown.
 * This ensures workflow failures don't block the primary operation.
 */
export function fireCrmWorkflowTrigger(payload: TriggerPayload): void {
  supabase.functions
    .invoke('execute-crm-workflow', { body: payload })
    .then(({ error }) => {
      if (error) logger.warn('[CRM Workflow] trigger failed:', payload.trigger_type, error.message);
    })
    .catch((err) => {
      logger.warn('[CRM Workflow] trigger error:', payload.trigger_type, err);
    });
}
