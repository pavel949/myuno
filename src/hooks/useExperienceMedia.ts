import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExperienceMediaItem {
  id: string;
  experience_id: string;
  media_type: string;
  source_image_url: string | null;
  stored_path: string | null;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export function useExperienceMedia(experienceId: string | undefined) {
  return useQuery({
    queryKey: ['experience-media', experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experience_media')
        .select('*')
        .eq('experience_id', experienceId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as ExperienceMediaItem[];
    },
    enabled: !!experienceId,
  });
}

export function useImportExperienceMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (experienceId: string) => {
      const { data, error } = await supabase.functions.invoke('import-experience-media', {
        body: { experience_id: experienceId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, experienceId) => {
      queryClient.invalidateQueries({ queryKey: ['experience-media', experienceId] });
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      queryClient.invalidateQueries({ queryKey: ['experience', experienceId] });
    },
  });
}
