/**
 * Owner statement approvals — fetch, sign, reject.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { toast } from 'sonner';

export type StatementApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface StatementApproval {
  id: string;
  company_id: string;
  property_id: string;
  owner_user_id: string;
  payout_id: string | null;
  period_start: string;
  period_end: string;
  statement_url: string | null;
  net_amount: number | null;
  currency: string | null;
  status: StatementApprovalStatus;
  signature_image_url: string | null;
  signed_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  comment: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Owner: fetch all approvals assigned to current user. */
export function useMyStatementApprovals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-statement-approvals', user?.id],
    queryFn: async (): Promise<StatementApproval[]> => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('owner_statement_approvals')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as StatementApproval[];
    },
    enabled: !!user,
  });
}

/** MC: fetch all approvals for active company. */
export function useCompanyStatementApprovals() {
  const { activeCompany } = useActiveCompany();
  return useQuery({
    queryKey: ['company-statement-approvals', activeCompany?.company_id],
    queryFn: async (): Promise<StatementApproval[]> => {
      if (!activeCompany) return [];
      const { data, error } = await (supabase as any)
        .from('owner_statement_approvals')
        .select('*')
        .eq('company_id', activeCompany.company_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as StatementApproval[];
    },
    enabled: !!activeCompany,
  });
}

/** Upload a signature dataURL to storage and return public URL. */
async function uploadSignature(userId: string, dataUrl: string, prefix: string) {
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${userId}/${prefix}-${Date.now()}.png`;
  const { error: upErr } = await supabase.storage
    .from('signatures')
    .upload(path, blob, { contentType: 'image/png', upsert: false });
  if (upErr) throw upErr;
  const { data } = await supabase.storage.from('signatures').createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
  return data?.signedUrl || path;
}

export function useSignStatement() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (args: { id: string; signatureDataUrl: string; comment?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const url = await uploadSignature(user.id, args.signatureDataUrl, `stmt-${args.id}`);
      const { error } = await (supabase as any)
        .from('owner_statement_approvals')
        .update({
          status: 'approved',
          signature_image_url: url,
          signed_at: new Date().toISOString(),
          comment: args.comment ?? null,
          signer_user_agent: navigator.userAgent,
        })
        .eq('id', args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Statement approved');
      qc.invalidateQueries({ queryKey: ['my-statement-approvals'] });
      qc.invalidateQueries({ queryKey: ['company-statement-approvals'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to sign'),
  });
}

export function useRejectStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; reason: string }) => {
      const { error } = await (supabase as any)
        .from('owner_statement_approvals')
        .update({
          status: 'rejected',
          rejection_reason: args.reason,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Statement rejected');
      qc.invalidateQueries({ queryKey: ['my-statement-approvals'] });
      qc.invalidateQueries({ queryKey: ['company-statement-approvals'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to reject'),
  });
}

export function useCreateStatementApproval() {
  const qc = useQueryClient();
  const { activeCompany } = useActiveCompany();
  return useMutation({
    mutationFn: async (args: {
      property_id: string;
      owner_user_id: string;
      payout_id?: string;
      period_start: string;
      period_end: string;
      net_amount?: number;
      currency?: string;
      statement_url?: string;
      expires_in_days?: number;
    }) => {
      if (!activeCompany) throw new Error('No active company');
      const expires_at = args.expires_in_days
        ? new Date(Date.now() + args.expires_in_days * 86400000).toISOString()
        : null;
      const { data, error } = await (supabase as any)
        .from('owner_statement_approvals')
        .insert({
          company_id: activeCompany.company_id,
          property_id: args.property_id,
          owner_user_id: args.owner_user_id,
          payout_id: args.payout_id ?? null,
          period_start: args.period_start,
          period_end: args.period_end,
          net_amount: args.net_amount ?? null,
          currency: args.currency ?? 'THB',
          statement_url: args.statement_url ?? null,
          expires_at,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Statement sent to owner');
      qc.invalidateQueries({ queryKey: ['company-statement-approvals'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to send'),
  });
}
