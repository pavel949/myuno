/**
 * Webhook endpoints for management companies — outbound event subscriptions.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { toast } from 'sonner';

export interface WebhookEndpoint {
  id: string;
  company_id: string;
  url: string;
  description: string | null;
  events: string[];
  secret: string;
  is_active: boolean;
  failure_count: number;
  last_success_at: string | null;
  last_failure_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  endpoint_id: string;
  event_type: string;
  payload: any;
  response_status: number | null;
  attempt_count: number;
  delivered_at: string | null;
  created_at: string;
}

export const WEBHOOK_EVENTS = [
  'booking.created',
  'booking.confirmed',
  'booking.cancelled',
  'payment.received',
  'payout.paid',
  'invoice.created',
  'invoice.paid',
  'property.created',
  'property.updated',
  'contact.created',
  'deal.won',
  'task.completed',
] as const;

function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return 'whsec_' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function useWebhookEndpoints() {
  const { activeCompany } = useActiveCompany();
  return useQuery({
    queryKey: ['webhook-endpoints', activeCompany?.company_id],
    queryFn: async (): Promise<WebhookEndpoint[]> => {
      if (!activeCompany) return [];
      const { data, error } = await (supabase as any)
        .from('webhook_endpoints')
        .select('*')
        .eq('company_id', activeCompany.company_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as WebhookEndpoint[];
    },
    enabled: !!activeCompany,
  });
}

export function useWebhookDeliveries(endpointId: string | undefined) {
  return useQuery({
    queryKey: ['webhook-deliveries', endpointId],
    queryFn: async (): Promise<WebhookDelivery[]> => {
      if (!endpointId) return [];
      const { data, error } = await (supabase as any)
        .from('webhook_deliveries')
        .select('*')
        .eq('endpoint_id', endpointId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as WebhookDelivery[];
    },
    enabled: !!endpointId,
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  return useMutation({
    mutationFn: async (args: { url: string; description?: string; events: string[] }) => {
      if (!user || !activeCompany) throw new Error('Missing context');
      const { error } = await (supabase as any).from('webhook_endpoints').insert({
        company_id: activeCompany.company_id,
        url: args.url,
        description: args.description ?? null,
        events: args.events,
        secret: generateSecret(),
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Webhook created');
      qc.invalidateQueries({ queryKey: ['webhook-endpoints'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });
}

export function useToggleWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from('webhook_endpoints')
        .update({ is_active: args.is_active })
        .eq('id', args.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhook-endpoints'] }),
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('webhook_endpoints').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Webhook deleted');
      qc.invalidateQueries({ queryKey: ['webhook-endpoints'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });
}
