/**
 * @module useCrmActivityLog
 * @description Unified activity timeline (call / meeting / email / note /
 * sms / whatsapp / site_visit) for a CRM contact or deal. Reads/writes the
 * existing `crm_activities` table (no new table introduced).
 *
 * Field mapping (DB → component vocabulary):
 *   subject       → title
 *   description   → body
 *   logged_by     → agent_id
 *   activity_date → occurred_at
 *
 * The AFTER-INSERT trigger `trg_crm_activities_set_last_activity_at` on
 * `crm_activities` advances `crm_contacts.last_activity_at` automatically,
 * which powers the cold-contacts widget.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const CRM_ACTIVITY_TYPES = [
  'call',
  'meeting',
  'email',
  'note',
  'sms',
  'whatsapp',
  'site_visit',
] as const;
export type CrmActivityType = typeof CRM_ACTIVITY_TYPES[number];

export interface CrmActivity {
  id: string;
  company_id: string;
  contact_id: string | null;
  deal_id: string | null;
  activity_type: CrmActivityType;
  subject: string | null;
  description: string | null;
  duration_minutes: number | null;
  outcome: string | null;
  metadata: Record<string, unknown> | null;
  logged_by: string;
  activity_date: string;
  created_at: string;
}

export interface CrmActivityInsert {
  company_id: string;
  contact_id?: string | null;
  deal_id?: string | null;
  activity_type: CrmActivityType;
  subject?: string | null;
  description?: string | null;
  duration_minutes?: number | null;
  outcome?: string | null;
  metadata?: Record<string, unknown> | null;
  activity_date?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: string | undefined | null): v is string => !!v && UUID_RE.test(v);

/** Timeline for a contact, newest first. */
export function useActivityLogForContact(contactId: string | undefined, limit = 100) {
  return useQuery({
    queryKey: ['crm-activity-log', 'contact', contactId, limit],
    queryFn: async (): Promise<CrmActivity[]> => {
      if (!isUuid(contactId)) return [];
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('contact_id', contactId)
        .order('activity_date', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as unknown as CrmActivity[];
    },
    enabled: isUuid(contactId),
  });
}

/** Timeline for a deal, newest first. */
export function useActivityLogForDeal(dealId: string | undefined, limit = 100) {
  return useQuery({
    queryKey: ['crm-activity-log', 'deal', dealId, limit],
    queryFn: async (): Promise<CrmActivity[]> => {
      if (!isUuid(dealId)) return [];
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('deal_id', dealId)
        .order('activity_date', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as unknown as CrmActivity[];
    },
    enabled: isUuid(dealId),
  });
}

/** Insert one entry. `logged_by` is filled from the current auth user. */
export function useCreateActivity() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: CrmActivityInsert): Promise<CrmActivity> => {
      if (!user) throw new Error('Not authenticated');
      const payload = {
        ...input,
        logged_by: user.id,
        activity_date: input.activity_date ?? new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('crm_activities')
        .insert(payload as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CrmActivity;
    },
    onSuccess: (row) => {
      // Invalidate any scope the new row affects so timelines refresh.
      if (row.contact_id) {
        qc.invalidateQueries({ queryKey: ['crm-activity-log', 'contact', row.contact_id] });
        // Cold-contacts widget reads last_activity_at — refresh that too.
        qc.invalidateQueries({ queryKey: ['crm-cold-contacts'] });
        qc.invalidateQueries({ queryKey: ['crm-contacts'] });
        qc.invalidateQueries({ queryKey: ['crm-contact', row.contact_id] });
      }
      if (row.deal_id) {
        qc.invalidateQueries({ queryKey: ['crm-activity-log', 'deal', row.deal_id] });
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to log activity');
    },
  });
}

/** Delete one entry — RLS will reject if you aren't the logger. */
export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; contact_id?: string | null; deal_id?: string | null }) => {
      const { error } = await supabase.from('crm_activities').delete().eq('id', vars.id);
      if (error) throw error;
      return vars;
    },
    onSuccess: (vars) => {
      if (vars.contact_id) {
        qc.invalidateQueries({ queryKey: ['crm-activity-log', 'contact', vars.contact_id] });
      }
      if (vars.deal_id) {
        qc.invalidateQueries({ queryKey: ['crm-activity-log', 'deal', vars.deal_id] });
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete activity');
    },
  });
}
