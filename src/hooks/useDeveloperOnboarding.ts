/**
 * Hooks for Developer Module onboarding, team management, and Stripe Connect.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────

export interface DeveloperUserMember {
  id: string;
  developer_id: string;
  auth_user_id: string | null;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  invite_expires_at: string | null;
  last_login_at: string | null;
  created_at: string;
}

// ── Team hooks ────────────────────────────────────────────────────────

export function useDeveloperTeam(developerId?: string) {
  return useQuery({
    queryKey: ['developer-team', developerId],
    queryFn: async (): Promise<DeveloperUserMember[]> => {
      if (!developerId) return [];
      const { data, error } = await supabase
        .from('developer_users')
        .select('*')
        .eq('developer_id', developerId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as DeveloperUserMember[];
    },
    enabled: !!developerId,
  });
}

export function useInviteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { developer_id: string; email: string; role: string }) => {
      const res = await supabase.functions.invoke('devmod-invite-team', { body: params });
      if (res.error) throw new Error(res.error.message);
      if (!res.data?.success) throw new Error(res.data?.error ?? 'Ошибка приглашения');
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['developer-team', vars.developer_id] });
      toast.success('Приглашение отправлено');
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка отправки приглашения'),
  });
}

// ── Stripe Connect hooks ──────────────────────────────────────────────

export interface StripeConnectStatus {
  connected: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  account_id: string | null;
}

export function useStripeConnectStatus(developerId?: string) {
  return useQuery({
    queryKey: ['stripe-connect-status', developerId],
    queryFn: async (): Promise<StripeConnectStatus> => {
      if (!developerId) return { connected: false, charges_enabled: false, payouts_enabled: false, account_id: null };
      const res = await supabase.functions.invoke('devmod-stripe-onboard', {
        body: { action: 'status', developer_id: developerId },
      });
      if (res.error) throw new Error(res.error.message);
      return res.data as StripeConnectStatus;
    },
    enabled: !!developerId,
    staleTime: 60_000,
  });
}

// ── Admin approval hooks (broker side) ───────────────────────────────

export interface PendingDeveloper {
  id: string;
  name_en: string;
  name_ru: string;
  legal_name: string | null;
  country: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  devmod_status: string;
  is_verified: boolean;
  created_at: string;
  user_id: string | null;
}

export function usePendingDevelopers() {
  return useQuery({
    queryKey: ['pending-developers'],
    queryFn: async (): Promise<PendingDeveloper[]> => {
      const { data, error } = await supabase
        .from('developers')
        .select('id, name_en, name_ru, legal_name, country, website, email, phone, devmod_status, is_verified, created_at, user_id')
        .eq('devmod_status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PendingDeveloper[];
    },
  });
}

export function useApproveDeveloper() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (developerId: string) => {
      const res = await supabase.functions.invoke('devmod-approve', {
        body: { developer_id: developerId },
      });
      if (res.error) throw new Error(res.error.message);
      if (!res.data?.success) throw new Error(res.data?.error ?? 'Ошибка одобрения');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-developers'] });
      toast.success('Застройщик одобрен и получил уведомление');
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка одобрения'),
  });
}

export function useRejectDeveloper() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ developerId, reason }: { developerId: string; reason?: string }) => {
      const { error } = await supabase
        .from('developers')
        .update({ devmod_status: 'suspended' } as Record<string, unknown>)
        .eq('id', developerId);
      if (error) throw error;
      // Optionally notify developer via edge function here
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-developers'] });
      toast.success('Заявка отклонена');
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка'),
  });
}
