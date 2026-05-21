/**
 * useCrmEmailAccount — current user's connected Gmail/IMAP CRM account.
 *
 * Returns null when no account is connected. Used by the composer to decide
 * whether to route through Gmail or fall back to Resend, and by the settings
 * page to show connection status.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CrmEmailAccount {
  id: string;
  user_id: string;
  company_id: string;
  provider: 'gmail';
  email_address: string;
  display_name: string | null;
  scopes: string[];
  gmail_history_id: string | null;
  last_synced_at: string | null;
  last_sync_status: 'pending' | 'ok' | 'error' | 'reauth_required';
  last_sync_error: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SELECT_COLS = [
  'id', 'user_id', 'company_id', 'provider', 'email_address', 'display_name',
  'scopes', 'gmail_history_id', 'last_synced_at', 'last_sync_status',
  'last_sync_error', 'is_active', 'created_at', 'updated_at',
].join(', ');

export function useCrmEmailAccount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['crm-email-account', user?.id],
    queryFn: async (): Promise<CrmEmailAccount | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('crm_email_accounts')
        .select(SELECT_COLS)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return (data as CrmEmailAccount | null) ?? null;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });
}

export function useConnectGmail() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ url: string }>('gmail-oauth-start', {
        body: { redirect_to: window.location.pathname + window.location.search },
      });
      if (error || !data?.url) throw new Error(error?.message ?? 'Failed to start OAuth');
      window.location.href = data.url;
    },
    onError: (err: Error) => {
      toast.error('Не удалось начать подключение', { description: err.message });
    },
  });
}

export function useDisconnectGmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId?: string) => {
      const { error } = await supabase.functions.invoke('gmail-disconnect', {
        body: accountId ? { account_id: accountId } : {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-email-account'] });
      toast.success('Gmail отключён');
    },
    onError: (err: Error) => {
      toast.error('Не удалось отключить', { description: err.message });
    },
  });
}

export function useTriggerGmailSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('gmail-sync', {
        body: { source: 'manual' },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-email-account'] });
      queryClient.invalidateQueries({ queryKey: ['crm-emails'] });
      toast.success('Синхронизация запущена');
    },
    onError: (err: Error) => {
      toast.error('Синхронизация не удалась', { description: err.message });
    },
  });
}
