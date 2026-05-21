/**
 * @module useCrmEmails
 * CRUD hooks for crm_emails
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { typedFrom } from '@/lib/untypedTables';

export interface CrmEmail {
  id: string;
  company_id: string;
  contact_id: string;
  deal_id: string | null;
  direction: string;
  to_email: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  sent_by: string | null;
  created_at: string;
  // Gmail integration fields (nullable for pre-Gmail rows)
  provider: 'gmail' | 'resend';
  from_email: string | null;
  gmail_message_id: string | null;
  gmail_thread_id: string | null;
  in_reply_to: string | null;
  references_ids: string[] | null;
  snippet: string | null;
  has_attachments: boolean;
  cc: string[] | null;
  bcc: string[] | null;
  email_account_id: string | null;
}

export function useCrmEmails(companyId: string | undefined, contactId?: string) {
  return useQuery({
    queryKey: ['crm-emails', companyId, contactId],
    queryFn: async (): Promise<CrmEmail[]> => {
      let q = typedFrom('crm_emails')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (contactId) q = q.eq('contact_id', contactId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as CrmEmail[];
    },
    enabled: !!companyId,
  });
}

export function useCreateCrmEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (email: Omit<CrmEmail, 'id' | 'created_at'>) => {
      const { data, error } = await typedFrom('crm_emails').insert(email).select().single();
      if (error) throw error;
      return data as CrmEmail;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-emails'] }),
    onError: (err: Error) => {
      import('sonner').then(({ toast }) => toast.error(err.message || 'Failed to create email'));
    },
  });
}

export function useUpdateCrmEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmEmail> & { id: string }) => {
      const { error } = await typedFrom('crm_emails').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-emails'] }),
    onError: (err: Error) => {
      import('sonner').then(({ toast }) => toast.error(err.message || 'Failed to update email'));
    },
  });
}

export function useSendCrmEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: string | { emailId: string; replyToEmailId?: string | null },
    ) => {
      const emailId = typeof input === 'string' ? input : input.emailId;
      const replyToEmailId = typeof input === 'string' ? null : input.replyToEmailId ?? null;
      const { data, error } = await supabase.functions.invoke('send-crm-email', {
        body: { email_id: emailId, reply_to_email_id: replyToEmailId },
      });
      if (error) throw error;
      return data as { success: boolean; provider: 'gmail' | 'resend' };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-emails'] });
      import('sonner').then(({ toast }) => toast.success('Email sent'));
    },
    onError: (err: Error) => {
      import('sonner').then(({ toast }) => toast.error(err.message || 'Failed to send email'));
    },
  });
}
