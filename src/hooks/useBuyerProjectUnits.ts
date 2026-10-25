import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { reconcileSalesAvailability, reconcileBuyerPrice } from '@/lib/offplan/buyerContract';

// Explicit public fields only. This projection does not replace deployed RLS.
export const BUYER_UNIT_FIELDS = 'id,project_id,unit_code,unit_type,area_sqm,bedrooms,bathrooms,floor,price,price_thb,currency,status,unit_status,floor_plan_url';
export function useBuyerProjectUnits(projectId: string) {
  return useQuery({ queryKey: ['buyer-project-units', projectId], enabled: !!projectId, queryFn: async () => {
    const { data, error } = await supabase.from('project_units').select(BUYER_UNIT_FIELDS).eq('project_id', projectId).order('unit_code');
    if (error) throw error;
    return (data || []).map(unit => ({ ...unit, ...reconcileBuyerPrice(unit.price, unit.currency, unit.price_thb), availability: reconcileSalesAvailability(unit.status, unit.unit_status) }));
  } });
}
