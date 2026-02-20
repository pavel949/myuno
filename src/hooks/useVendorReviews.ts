import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyCompanyId } from './useAgentDeals';

export interface VendorReview {
  id: string;
  company_id: string;
  vendor_id: string;
  property_id: string | null;
  task_id: string | null;
  quality_score: number;
  speed_score: number;
  communication_score: number;
  overall_score: number;
  notes: string | null;
  reviewed_by: string;
  created_at: string;
}

export function useVendorReviews(vendorId?: string) {
  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id;

  return useQuery({
    queryKey: ['vendor-reviews', companyId, vendorId],
    queryFn: async () => {
      let q = supabase
        .from('vendor_performance_reviews')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });

      if (vendorId) q = q.eq('vendor_id', vendorId);

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as VendorReview[];
    },
    enabled: !!companyId,
  });
}

export function useVendorAvgScore(vendorId: string) {
  const { data: reviews } = useVendorReviews(vendorId);
  if (!reviews?.length) return null;
  const avg = reviews.reduce((s, r) => s + r.overall_score, 0) / reviews.length;
  return Math.round(avg * 10) / 10;
}

export function useCreateVendorReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (review: {
      company_id: string;
      vendor_id: string;
      property_id?: string;
      task_id?: string;
      quality_score: number;
      speed_score: number;
      communication_score: number;
      overall_score: number;
      notes?: string;
      reviewed_by: string;
    }) => {
      const { data, error } = await supabase
        .from('vendor_performance_reviews')
        .insert(review as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-reviews'] });
    },
  });
}
