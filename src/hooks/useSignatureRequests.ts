/**
 * E-signature request workflow hooks.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { toast } from 'sonner';

type SignatureRequestInsert = Database['public']['Tables']['signature_requests']['Insert'];
type SignatureRequestUpdate = Database['public']['Tables']['signature_requests']['Update'];
type SignatureSignerInsert = Database['public']['Tables']['signature_request_signers']['Insert'];
type SignatureSignerUpdate = Database['public']['Tables']['signature_request_signers']['Update'];

export type SignatureRequestStatus =
  | 'draft' | 'sent' | 'partially_signed' | 'completed' | 'declined' | 'expired' | 'cancelled';

export interface SignatureRequest {
  id: string;
  company_id: string;
  created_by: string;
  title: string;
  description: string | null;
  document_url: string;
  document_type: string;
  related_property_id: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  status: SignatureRequestStatus;
  signed_document_url: string | null;
  expires_at: string | null;
  sent_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SignatureSigner {
  id: string;
  request_id: string;
  signer_user_id: string | null;
  signer_email: string | null;
  signer_name: string;
  signer_role: string;
  sign_order: number;
  status: 'pending' | 'signed' | 'declined';
  signature_image_url: string | null;
  signed_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  access_token: string | null;
  notified_at: string | null;
  reminder_count: number;
  created_at: string;
  updated_at: string;
}

/** MC: list company signature requests with signers. */
export function useCompanySignatureRequests() {
  const { activeCompany } = useActiveCompany();
  return useQuery({
    queryKey: ['company-signature-requests', activeCompany?.company_id],
    queryFn: async () => {
      if (!activeCompany) return [];
      const { data, error } = await supabase
        .from('signature_requests')
        .select('*, signature_request_signers(*)')
        .eq('company_id', activeCompany.company_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as (SignatureRequest & { signature_request_signers: SignatureSigner[] })[];
    },
    enabled: !!activeCompany,
  });
}

/** Owner: list requests where I'm a signer. */
export function useMySignatureRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-signature-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: signers, error: sErr } = await supabase
        .from('signature_request_signers')
        .select('*, signature_requests(*)')
        .eq('signer_user_id', user.id)
        .order('created_at', { ascending: false });
      if (sErr) throw sErr;
      return (signers || []) as unknown as (SignatureSigner & { signature_requests: SignatureRequest })[];
    },
    enabled: !!user,
  });
}

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

/** Sign a signature request (as signer). */
export function useSignRequest() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (args: { signerId: string; signatureDataUrl: string }) => {
      if (!user) throw new Error('Not authenticated');
      const url = await uploadSignature(user.id, args.signatureDataUrl, `sigreq-${args.signerId}`);
      const { error } = await supabase
        .from('signature_request_signers')
        .update({
          status: 'signed',
          signature_image_url: url,
          signed_at: new Date().toISOString(),
          signer_user_agent: navigator.userAgent,
        } as SignatureSignerUpdate)
        .eq('id', args.signerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Document signed');
      qc.invalidateQueries({ queryKey: ['my-signature-requests'] });
      qc.invalidateQueries({ queryKey: ['company-signature-requests'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Sign failed'),
  });
}

export function useDeclineSignRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { signerId: string; reason: string }) => {
      const { error } = await supabase
        .from('signature_request_signers')
        .update({
          status: 'declined',
          declined_at: new Date().toISOString(),
          decline_reason: args.reason,
        } as SignatureSignerUpdate)
        .eq('id', args.signerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Document declined');
      qc.invalidateQueries({ queryKey: ['my-signature-requests'] });
      qc.invalidateQueries({ queryKey: ['company-signature-requests'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Decline failed'),
  });
}

/** MC: create a new signature request with signers. */
export function useCreateSignatureRequest() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  return useMutation({
    mutationFn: async (args: {
      title: string;
      document_url: string;
      description?: string;
      document_type?: string;
      related_property_id?: string;
      expires_in_days?: number;
      signers: Array<{
        signer_user_id?: string;
        signer_email?: string;
        signer_name: string;
        signer_role?: string;
        sign_order?: number;
      }>;
    }) => {
      if (!user || !activeCompany) throw new Error('Missing context');
      const expires_at = args.expires_in_days
        ? new Date(Date.now() + args.expires_in_days * 86400000).toISOString()
        : null;
      const { data: req, error } = await supabase
        .from('signature_requests')
        .insert({
          company_id: activeCompany.company_id,
          created_by: user.id,
          title: args.title,
          description: args.description ?? null,
          document_url: args.document_url,
          document_type: args.document_type ?? 'contract',
          related_property_id: args.related_property_id ?? null,
          status: 'sent',
          sent_at: new Date().toISOString(),
          expires_at,
        } as SignatureRequestInsert)
        .select()
        .single();
      if (error) throw error;
      const signerRows: SignatureSignerInsert[] = args.signers.map((s, i) => ({
        request_id: req.id,
        signer_user_id: s.signer_user_id ?? null,
        signer_email: s.signer_email ?? null,
        signer_name: s.signer_name,
        signer_role: s.signer_role ?? 'owner',
        sign_order: s.sign_order ?? i + 1,
      }));
      const { error: signersErr } = await supabase
        .from('signature_request_signers')
        .insert(signerRows);
      if (signersErr) throw signersErr;
      return req;
    },
    onSuccess: () => {
      toast.success('Signature request sent');
      qc.invalidateQueries({ queryKey: ['company-signature-requests'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create request'),
  });
}

export function useCancelSignatureRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; reason?: string }) => {
      const { error } = await (supabase as any)
        .from('signature_requests')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: args.reason ?? null,
        })
        .eq('id', args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Request cancelled');
      qc.invalidateQueries({ queryKey: ['company-signature-requests'] });
    },
  });
}
