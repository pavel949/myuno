import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VendorProspect {
  id: string;
  source_type: 'instagram' | 'facebook' | 'google_maps' | 'manual' | 'inbound' | 'referral';
  source_url: string | null;
  source_data: Record<string, unknown>;
  business_name: string;
  business_name_ru: string | null;
  business_type: string | null;
  category: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  address: string | null;
  district: string | null;
  city: string;
  lat: number | null;
  lng: number | null;
  followers_count: number | null;
  posts_count: number | null;
  engagement_rate: number | null;
  last_post_at: string | null;
  ai_score: number | null;
  ai_priority: 'hot' | 'warm' | 'cold' | 'not_fit' | null;
  ai_reasoning: string | null;
  ai_recommended_plan: string | null;
  ai_talking_points: string[] | null;
  ai_analyzed_at: string | null;
  status: 'new' | 'researching' | 'contacted' | 'replied' | 'meeting' | 'negotiating' | 'won' | 'lost' | 'not_interested';
  assigned_to: string | null;
  outreach_channel: string | null;
  first_contact_at: string | null;
  last_contact_at: string | null;
  contact_count: number;
  next_followup_at: string | null;
  notes: string | null;
  rejection_reason: string | null;
  converted_provider_id: string | null;
  converted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProspectActivity {
  id: string;
  prospect_id: string;
  activity_type: string;
  old_value: string | null;
  new_value: string | null;
  message_content: string | null;
  message_channel: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface OutreachTemplate {
  id: string;
  name: string;
  channel: 'whatsapp' | 'email' | 'instagram_dm' | 'sms';
  language: 'ru' | 'en' | 'th';
  business_type: string | null;
  stage: string;
  subject: string | null;
  template: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

// Pipeline status colors and labels
export const statusConfig: Record<string, { label: string; labelRu: string; color: string; bgColor: string }> = {
  new: { label: 'New', labelRu: 'Новый', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  researching: { label: 'Researching', labelRu: 'Исследование', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  contacted: { label: 'Contacted', labelRu: 'Контакт', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  replied: { label: 'Replied', labelRu: 'Ответил', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  meeting: { label: 'Meeting', labelRu: 'Встреча', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  negotiating: { label: 'Negotiating', labelRu: 'Переговоры', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  won: { label: 'Won', labelRu: 'Выигран', color: 'text-green-700', bgColor: 'bg-green-100' },
  lost: { label: 'Lost', labelRu: 'Потерян', color: 'text-red-700', bgColor: 'bg-red-100' },
  not_interested: { label: 'Not Interested', labelRu: 'Не интересно', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

export const priorityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  hot: { label: '🔥 Hot', color: 'text-red-700', bgColor: 'bg-red-100' },
  warm: { label: '☀️ Warm', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  cold: { label: '❄️ Cold', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  not_fit: { label: '⛔ Not Fit', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

export const sourceConfig: Record<string, { label: string; icon: string }> = {
  instagram: { label: 'Instagram', icon: '📸' },
  facebook: { label: 'Facebook', icon: '📘' },
  google_maps: { label: 'Google Maps', icon: '📍' },
  manual: { label: 'Manual', icon: '✍️' },
  inbound: { label: 'Inbound', icon: '📥' },
  referral: { label: 'Referral', icon: '🤝' },
};

// Fetch all prospects
export function useVendorProspects(filters?: {
  status?: string;
  priority?: string;
  source_type?: string;
  assigned_to?: string;
}) {
  return useQuery({
    queryKey: ['vendor-prospects', filters],
    queryFn: async () => {
      let query = supabase
        .from('vendor_prospects')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('ai_priority', filters.priority);
      }
      if (filters?.source_type) {
        query = query.eq('source_type', filters.source_type);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VendorProspect[];
    },
  });
}

// Fetch single prospect with activity
export function useVendorProspect(id: string | undefined) {
  return useQuery({
    queryKey: ['vendor-prospect', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('vendor_prospects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as VendorProspect;
    },
    enabled: !!id,
  });
}

// Fetch prospect activity
export function useProspectActivity(prospectId: string | undefined) {
  return useQuery({
    queryKey: ['prospect-activity', prospectId],
    queryFn: async () => {
      if (!prospectId) return [];

      const { data, error } = await supabase
        .from('vendor_prospect_activity')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProspectActivity[];
    },
    enabled: !!prospectId,
  });
}

// Fetch outreach templates
export function useOutreachTemplates() {
  return useQuery({
    queryKey: ['outreach-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_outreach_templates')
        .select('*')
        .eq('is_active', true)
        .order('stage');

      if (error) throw error;
      return data as OutreachTemplate[];
    },
  });
}

// Create prospect
export function useCreateProspect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prospect: {
      business_name: string;
      source_type: string;
      business_type?: string;
      contact_name?: string;
      email?: string;
      phone?: string;
      instagram?: string;
      website?: string;
      address?: string;
      district?: string;
      source_url?: string;
    }) => {
      const { data, error } = await supabase
        .from('vendor_prospects')
        .insert(prospect)
        .select()
        .single();

      if (error) throw error;
      return data as VendorProspect;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-prospects'] });
      toast.success('Проспект добавлен');
    },
    onError: () => {
      toast.error('Ошибка создания проспекта');
    },
  });
}

// Update prospect
export function useUpdateProspect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; notes?: string; assigned_to?: string; next_followup_at?: string; contact_count?: number; last_contact_at?: string; outreach_channel?: string }) => {
      const { data, error } = await supabase
        .from('vendor_prospects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as VendorProspect;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-prospects'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-prospect', data.id] });
    },
    onError: () => {
      toast.error('Ошибка обновления');
    },
  });
}

// AI Score prospect
export function useScoreProspect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prospectId: string) => {
      const { data, error } = await supabase.functions.invoke('vendor-acquisition/score', {
        body: { prospectId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, prospectId) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-prospects'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-prospect', prospectId] });
      toast.success('AI-анализ завершён');
    },
    onError: () => {
      toast.error('Ошибка AI-анализа');
    },
  });
}

// Generate outreach message
export function useGenerateOutreach() {
  return useMutation({
    mutationFn: async (params: {
      prospectId: string;
      channel: 'whatsapp' | 'email' | 'instagram_dm';
      language: 'ru' | 'en';
      stage: string;
      managerName?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('vendor-acquisition/generate-outreach', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onError: () => {
      toast.error('Ошибка генерации сообщения');
    },
  });
}

// Batch import prospects
export function useBatchImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      prospects: Partial<VendorProspect>[];
      autoScore?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke('vendor-acquisition/batch-import', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-prospects'] });
      toast.success(`Импортировано: ${data.data?.imported || 0}`);
    },
    onError: () => {
      toast.error('Ошибка импорта');
    },
  });
}

// Analyze URL
export function useAnalyzeUrl() {
  return useMutation({
    mutationFn: async (params: { url: string; sourceType: string }) => {
      const { data, error } = await supabase.functions.invoke('vendor-acquisition/analyze-url', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onError: () => {
      toast.error('Ошибка анализа URL');
    },
  });
}

// Log activity
export function useLogActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: {
      prospect_id: string;
      activity_type: string;
      old_value?: string;
      new_value?: string;
      message_content?: string;
      message_channel?: string;
    }) => {
      const { data, error } = await supabase
        .from('vendor_prospect_activity')
        .insert(activity)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['prospect-activity', data.prospect_id] });
    },
  });
}

// Pipeline stats
export function useProspectStats() {
  return useQuery({
    queryKey: ['prospect-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_prospects')
        .select('status, ai_priority, source_type');

      if (error) throw error;

      const stats = {
        total: data.length,
        byStatus: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        bySource: {} as Record<string, number>,
        conversionRate: 0,
      };

      data.forEach((p) => {
        stats.byStatus[p.status] = (stats.byStatus[p.status] || 0) + 1;
        if (p.ai_priority) {
          stats.byPriority[p.ai_priority] = (stats.byPriority[p.ai_priority] || 0) + 1;
        }
        stats.bySource[p.source_type] = (stats.bySource[p.source_type] || 0) + 1;
      });

      const won = stats.byStatus['won'] || 0;
      const contacted = data.filter(p => !['new', 'researching'].includes(p.status)).length;
      stats.conversionRate = contacted > 0 ? Math.round((won / contacted) * 100) : 0;

      return stats;
    },
  });
}
