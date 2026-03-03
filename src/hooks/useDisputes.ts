import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { untypedTables } from '@/lib/untypedTables';

export interface Dispute {
  id: string;
  order_id: string | null;
  user_id: string;
  provider_id: string | null;
  dispute_type: string;
  status: string;
  description: string;
  evidence_urls: string[];
  resolution: string | null;
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export const DISPUTE_TYPES = [
  { value: 'service_quality', labelEn: 'Service Quality', labelRu: 'Качество услуги' },
  { value: 'not_delivered', labelEn: 'Not Delivered', labelRu: 'Не оказана' },
  { value: 'wrong_item', labelEn: 'Wrong Item/Service', labelRu: 'Не тот товар/услуга' },
  { value: 'overcharged', labelEn: 'Overcharged', labelRu: 'Завышена цена' },
  { value: 'safety_issue', labelEn: 'Safety Issue', labelRu: 'Проблема безопасности' },
  { value: 'other', labelEn: 'Other', labelRu: 'Другое' },
] as const;

export function useMyDisputes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-disputes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await untypedTables.disputes()
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Dispute[];
    },
  });
}

export function useCreateDispute() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      orderId?: string;
      providerId?: string;
      disputeType: string;
      description: string;
      evidenceUrls?: string[];
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await untypedTables.disputes().insert({
        order_id: input.orderId || null,
        user_id: user.id,
        provider_id: input.providerId || null,
        dispute_type: input.disputeType,
        description: input.description,
        evidence_urls: input.evidenceUrls || [],
        status: 'open',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
    },
  });
}

export function useAdminDisputes() {
  return useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      const { data, error } = await untypedTables.disputes()
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as Dispute[];
    },
  });
}

export function useResolveDispute() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ disputeId, status, resolution, adminNotes }: {
      disputeId: string;
      status: 'under_review' | 'resolved' | 'rejected';
      resolution?: string;
      adminNotes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const updates: Record<string, any> = { status };
      if (resolution) updates.resolution = resolution;
      if (adminNotes) updates.admin_notes = adminNotes;
      if (status === 'resolved' || status === 'rejected') {
        updates.resolved_by = user.id;
        updates.resolved_at = new Date().toISOString();
      }
      updates.updated_at = new Date().toISOString();

      const { error } = await untypedTables.disputes()
        .update(updates)
        .eq('id', disputeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
    },
  });
}
