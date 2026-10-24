import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveCompany } from '@/hooks/useActiveCompany';

export interface ResortProject { id: string; nameEn: string; nameRu: string | null }

/** Complexes (property_projects) of the active management company. */
export function useResortProjects() {
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id ?? null;
  return useQuery({
    queryKey: ['pms-resort-projects', companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<ResortProject[]> => {
      const { data, error } = await supabase
        .from('property_projects')
        .select('id, name_en, name_ru')
        .eq('management_company_id', companyId as string)
        .order('name_en');
      if (error) throw error;
      return (data ?? []).map(p => ({ id: p.id, nameEn: p.name_en, nameRu: p.name_ru }));
    },
  });
}
