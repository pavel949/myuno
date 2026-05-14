/**
 * useLeadMagnets — admin CRUD hooks for lead_magnets + submissions.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const MAGNET_TYPES = [
  'clearview_report',
  'calculator_save',
  'guide_pdf',
  'area_report',
  'watchlist',
  'prelaunch_alert',
  'viewing_request',
  'resale_weekly',
  'offmarket_access',
  'market_report',
  'newsletter',
  'other',
] as const;

export type MagnetType = typeof MAGNET_TYPES[number];

export interface LeadMagnet {
  id: string;
  slug: string;
  magnet_type: MagnetType;
  title_ru: string;
  title_en: string;
  description_ru: string | null;
  description_en: string | null;
  asset_url: string | null;
  default_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadMagnetSubmission {
  id: string;
  magnet_id: string | null;
  magnet_slug: string;
  context_type: string | null;
  context_slug: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  preferred_channel: string | null;
  language: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_path: string | null;
  score: number;
  status: string;
  notes: string | null;
  created_at: string;
}

export type MagnetUpsert = Partial<Omit<LeadMagnet, 'id' | 'created_at' | 'updated_at'>> & {
  id?: string;
  slug: string;
  magnet_type: MagnetType;
  title_ru: string;
  title_en: string;
};

export function useLeadMagnets() {
  return useQuery({
    queryKey: ['lead-magnets', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_magnets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as LeadMagnet[];
    },
  });
}

export function useUpsertLeadMagnet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MagnetUpsert) => {
      const { data, error } = await supabase
        .from('lead_magnets')
        .upsert(payload, { onConflict: 'slug' })
        .select()
        .single();
      if (error) throw error;
      return data as LeadMagnet;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead-magnets'] }),
  });
}

export function useToggleLeadMagnet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('lead_magnets')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead-magnets'] }),
  });
}

export function useDeleteLeadMagnet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lead_magnets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead-magnets'] }),
  });
}

export function useLeadMagnetSubmissions(magnetSlug?: string) {
  return useQuery({
    queryKey: ['lead-magnet-submissions', magnetSlug ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('lead_magnet_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (magnetSlug) q = q.eq('magnet_slug', magnetSlug);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as LeadMagnetSubmission[];
    },
  });
}

export function useUpdateSubmissionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const patch: Record<string, unknown> = { status };
      if (notes !== undefined) patch.notes = notes;
      const { error } = await supabase
        .from('lead_magnet_submissions')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead-magnet-submissions'] }),
  });
}
