import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';
import { CACHE_PROFILES } from '@/lib/queryConfig';

interface EntityOption {
  id: string;
  name: string;
  name_ru?: string;
}

interface EntityData {
  providers: EntityOption[];
  vendors: EntityOption[];
  pm_companies: EntityOption[];
  projects: EntityOption[];
}

async function fetchContractEntities(): Promise<EntityData> {
  const [providersRes, vendorsRes, pmRes] = await Promise.all([
    supabase.from('providers').select('id, name').eq('is_active', true).order('name'),
    supabase.from('marketplace_vendors').select('id, name_en, name_ru').eq('is_active', true).order('name_en'),
    supabase.from('management_companies').select('id, name_en, name_ru').eq('is_active', true).order('name_en'),
  ]);

  return {
    providers: (providersRes.data || []).map(p => ({ id: p.id, name: p.name })),
    vendors: (vendorsRes.data || []).map(v => ({ id: v.id, name: v.name_en, name_ru: v.name_ru })),
    pm_companies: (pmRes.data || []).map(c => ({ id: c.id, name: c.name_en, name_ru: c.name_ru })),
    projects: [],
  };
}

export function useContractEntities() {
  const { data: entities, isLoading } = useQuery({
    queryKey: ['contract-entities'],
    queryFn: fetchContractEntities,
    ...CACHE_PROFILES.STATIC,
  });

  const safeEntities = entities || { providers: [], vendors: [], pm_companies: [], projects: [] };

  const getEntityName = useCallback((entityType: string, entityId: string, isRu: boolean = false): string => {
    const list = safeEntities[entityType as keyof EntityData] || [];
    const entity = list.find(e => e.id === entityId);
    if (!entity) return entityId.slice(0, 8) + '...';
    return isRu && entity.name_ru ? entity.name_ru : entity.name;
  }, [safeEntities]);

  const getEntitiesByType = useCallback((entityType: string): EntityOption[] => {
    return safeEntities[entityType as keyof EntityData] || [];
  }, [safeEntities]);

  return {
    entities: safeEntities,
    isLoading,
    getEntityName,
    getEntitiesByType,
  };
}
