/**
 * Approval workflows & requests — multi-step approval chains for expenses, POs, contracts.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { toast } from 'sonner';

export type ApprovalEntityType = 'expense' | 'purchase_order' | 'contract' | 'payout' | 'invoice' | 'other';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ApprovalStepStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

export interface ApprovalWorkflow {
  id: string;
  company_id: string;
  name: string;
  entity_type: ApprovalEntityType;
  min_amount: number | null;
  max_amount: number | null;
  currency: string | null;
  approver_user_ids: string[];
  require_all: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ApprovalRequest {
  id: string;
  company_id: string;
  workflow_id: string | null;
  entity_type: string;
  entity_id: string | null;
  title: string;
  description: string | null;
  amount: number | null;
  currency: string | null;
  status: ApprovalStatus;
  requested_by: string;
  metadata: Record<string, any> | null;
  created_at: string;
  resolved_at: string | null;
}

export interface ApprovalStep {
  id: string;
  request_id: string;
  sequence: number;
  approver_user_id: string;
  status: ApprovalStepStatus;
  comment: string | null;
  decided_at: string | null;
}

export function useApprovalWorkflows() {
  const { activeCompany } = useActiveCompany();
  return useQuery({
    queryKey: ['approval-workflows', activeCompany?.company_id],
    queryFn: async (): Promise<ApprovalWorkflow[]> => {
      if (!activeCompany) return [];
      const { data, error } = await (supabase as any)
        .from('approval_workflows')
        .select('*')
        .eq('company_id', activeCompany.company_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ApprovalWorkflow[];
    },
    enabled: !!activeCompany,
  });
}

export function useApprovalRequests(filter?: { status?: ApprovalStatus }) {
  const { activeCompany } = useActiveCompany();
  return useQuery({
    queryKey: ['approval-requests', activeCompany?.company_id, filter?.status],
    queryFn: async (): Promise<ApprovalRequest[]> => {
      if (!activeCompany) return [];
      let q = (supabase as any)
        .from('approval_requests')
        .select('*')
        .eq('company_id', activeCompany.company_id)
        .order('created_at', { ascending: false });
      if (filter?.status) q = q.eq('status', filter.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ApprovalRequest[];
    },
    enabled: !!activeCompany,
  });
}

/** Steps assigned to current user that are pending. */
export function useMyPendingApprovalSteps() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-approval-steps', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('approval_steps')
        .select('*, approval_requests(*)')
        .eq('approver_user_id', user.id)
        .eq('status', 'pending');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useRequestSteps(requestId: string | undefined) {
  return useQuery({
    queryKey: ['approval-request-steps', requestId],
    queryFn: async (): Promise<ApprovalStep[]> => {
      if (!requestId) return [];
      const { data, error } = await (supabase as any)
        .from('approval_steps')
        .select('*')
        .eq('request_id', requestId)
        .order('sequence');
      if (error) throw error;
      return (data || []) as ApprovalStep[];
    },
    enabled: !!requestId,
  });
}

export function useCreateApprovalRequest() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  return useMutation({
    mutationFn: async (args: {
      title: string;
      description?: string;
      entity_type: ApprovalEntityType;
      entity_id?: string;
      amount?: number;
      currency?: string;
      approver_user_ids: string[];
      workflow_id?: string;
    }) => {
      if (!user || !activeCompany) throw new Error('Missing context');
      const { data: req, error } = await (supabase as any)
        .from('approval_requests')
        .insert({
          company_id: activeCompany.company_id,
          workflow_id: args.workflow_id ?? null,
          entity_type: args.entity_type,
          entity_id: args.entity_id ?? null,
          title: args.title,
          description: args.description ?? null,
          amount: args.amount ?? null,
          currency: args.currency ?? 'THB',
          requested_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      // Create steps
      const steps = args.approver_user_ids.map((uid, i) => ({
        request_id: req.id,
        sequence: i,
        approver_user_id: uid,
      }));
      if (steps.length) {
        const { error: stepsErr } = await (supabase as any).from('approval_steps').insert(steps);
        if (stepsErr) throw stepsErr;
      }
      return req;
    },
    onSuccess: () => {
      toast.success('Approval request created');
      qc.invalidateQueries({ queryKey: ['approval-requests'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });
}

export function useDecideApprovalStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { stepId: string; decision: 'approved' | 'rejected'; comment?: string }) => {
      const { error } = await (supabase as any)
        .from('approval_steps')
        .update({
          status: args.decision,
          comment: args.comment ?? null,
          decided_at: new Date().toISOString(),
        })
        .eq('id', args.stepId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Decision recorded');
      qc.invalidateQueries({ queryKey: ['my-approval-steps'] });
      qc.invalidateQueries({ queryKey: ['approval-requests'] });
      qc.invalidateQueries({ queryKey: ['approval-request-steps'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });
}
