/**
 * @module useCrmSequences
 * CRUD hooks for crm_sequences, crm_sequence_steps, crm_sequence_enrollments
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CrmSequence {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface CrmSequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  action_type: string; // 'task' | 'wait' | 'email' | 'whatsapp'
  delay_days: number;
  task_type: string | null;
  task_title: string | null;
  template_content: string | null;
  sort_order: number;
}

export interface CrmSequenceEnrollment {
  id: string;
  sequence_id: string;
  contact_id: string;
  deal_id: string | null;
  current_step: number;
  status: string;
  enrolled_at: string;
  enrolled_by: string;
  next_action_at: string | null;
  completed_at: string | null;
}

export interface SequenceWithSteps extends CrmSequence {
  steps: CrmSequenceStep[];
  enrollment_count?: number;
}

const from = (table: string) => (supabase as any).from(table);

export function useCrmSequences(companyId: string | undefined) {
  return useQuery({
    queryKey: ['crm-sequences', companyId],
    queryFn: async (): Promise<SequenceWithSteps[]> => {
      const { data: seqs, error } = await from('crm_sequences')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const ids = (seqs || []).map((s: any) => s.id);
      if (ids.length === 0) return [];

      const { data: steps, error: sErr } = await from('crm_sequence_steps')
        .select('*')
        .in('sequence_id', ids)
        .order('step_order');
      if (sErr) throw sErr;

      const { data: enrollments, error: eErr } = await from('crm_sequence_enrollments')
        .select('sequence_id, status')
        .in('sequence_id', ids)
        .eq('status', 'active');
      if (eErr) throw eErr;

      const stepMap = new Map<string, CrmSequenceStep[]>();
      for (const s of (steps || []) as CrmSequenceStep[]) {
        const arr = stepMap.get(s.sequence_id) || [];
        arr.push(s);
        stepMap.set(s.sequence_id, arr);
      }

      const countMap = new Map<string, number>();
      for (const e of (enrollments || []) as any[]) {
        countMap.set(e.sequence_id, (countMap.get(e.sequence_id) || 0) + 1);
      }

      return (seqs as CrmSequence[]).map(s => ({
        ...s,
        steps: stepMap.get(s.id) || [],
        enrollment_count: countMap.get(s.id) || 0,
      }));
    },
    enabled: !!companyId,
  });
}

export function useCreateSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (seq: Omit<CrmSequence, 'id' | 'created_at'>) => {
      const { data, error } = await from('crm_sequences').insert(seq).select().single();
      if (error) throw error;
      return data as CrmSequence;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-sequences'] }),
  });
}

export function useUpdateSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmSequence> & { id: string }) => {
      const { error } = await from('crm_sequences').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-sequences'] }),
  });
}

export function useDeleteSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await from('crm_sequences').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-sequences'] }),
  });
}

export function useUpsertSequenceSteps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sequenceId, steps }: { sequenceId: string; steps: Omit<CrmSequenceStep, 'id'>[] }) => {
      // Delete existing steps, then insert new ones
      await from('crm_sequence_steps').delete().eq('sequence_id', sequenceId);
      if (steps.length > 0) {
        const { error } = await from('crm_sequence_steps').insert(steps);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-sequences'] }),
  });
}

export function useEnrollInSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (enrollment: Omit<CrmSequenceEnrollment, 'id' | 'enrolled_at' | 'completed_at'>) => {
      const { data, error } = await from('crm_sequence_enrollments').insert(enrollment).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-sequences'] }),
  });
}

export function useSequenceEnrollments(sequenceId: string | undefined) {
  return useQuery({
    queryKey: ['crm-sequence-enrollments', sequenceId],
    queryFn: async (): Promise<CrmSequenceEnrollment[]> => {
      const { data, error } = await from('crm_sequence_enrollments')
        .select('*')
        .eq('sequence_id', sequenceId!)
        .order('enrolled_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CrmSequenceEnrollment[];
    },
    enabled: !!sequenceId,
  });
}
