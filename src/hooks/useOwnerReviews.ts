import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface OwnerReview {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  images: string[];
  pros: string | null;
  cons: string | null;
  visit_date: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  response: string | null;
  response_at: string | null;
  is_featured: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  property_title?: string;
  property_title_ru?: string;
  property_cover?: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  pendingResponses: number;
  distribution: number[];
  recentCount: number; // last 30 days
}

export function useOwnerReviews() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['owner-reviews', user?.id];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return { reviews: [], stats: null };

      // First get owner's property IDs from unified table
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, title_en, title_ru, cover_image')
        .eq('owner_id', user.id);

      if (propError) throw propError;
      if (!properties?.length) return { reviews: [], stats: null };

      const propertyIds = properties.map(p => p.id);
      const propertyMap = new Map(properties.map(p => [p.id, p]));

      // Get reviews for these properties
      const { data: reviews, error: revError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('item_type', 'property')
        .in('item_id', propertyIds)
        .order('created_at', { ascending: false });

      if (revError) throw revError;

      // Map reviews with property info
      const mappedReviews: OwnerReview[] = (reviews || []).map(r => {
        const property = propertyMap.get(r.item_id);
        return {
          ...r,
          images: r.images || [],
          property_title: property?.title_en,
          property_title_ru: property?.title_ru,
          property_cover: property?.cover_image,
          reviewer_name: (r.profiles as any)?.full_name,
          reviewer_avatar: (r.profiles as any)?.avatar_url,
        };
      });

      // Calculate stats
      const totalReviews = mappedReviews.length;
      const averageRating = totalReviews > 0 
        ? mappedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
        : 0;
      const pendingResponses = mappedReviews.filter(r => !r.response).length;
      const distribution = [0, 0, 0, 0, 0];
      mappedReviews.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) {
          distribution[r.rating - 1]++;
        }
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentCount = mappedReviews.filter(
        r => new Date(r.created_at) > thirtyDaysAgo
      ).length;

      const stats: ReviewStats = {
        totalReviews,
        averageRating,
        pendingResponses,
        distribution,
        recentCount,
      };

      return { reviews: mappedReviews, stats };
    },
    enabled: !!user,
  });

  const respondToReview = useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: string; response: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Verify ownership: check that this review belongs to owner's property
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);
      
      const propertyIds = properties?.map(p => p.id) || [];
      
      // Check if review is for owner's property
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('item_id')
        .eq('id', reviewId)
        .eq('item_type', 'property')
        .single();
      
      if (reviewError || !review) throw new Error('Review not found');
      if (!propertyIds.includes(review.item_id)) {
        throw new Error('Unauthorized: You can only respond to reviews on your properties');
      }
      
      const { data, error } = await supabase
        .from('reviews')
        .update({
          response,
          response_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Response saved');
    },
    onError: () => {
      toast.error('Failed to save response');
    },
  });

  const deleteResponse = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      // Verify ownership before deleting response
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);
      
      const propertyIds = properties?.map(p => p.id) || [];
      
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('item_id')
        .eq('id', reviewId)
        .eq('item_type', 'property')
        .single();
      
      if (reviewError || !review) throw new Error('Review not found');
      if (!propertyIds.includes(review.item_id)) {
        throw new Error('Unauthorized');
      }
      
      const { error } = await supabase
        .from('reviews')
        .update({
          response: null,
          response_at: null,
        })
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Response deleted');
    },
    onError: () => {
      toast.error('Failed to delete response');
    },
  });

  return {
    reviews: data?.reviews || [],
    stats: data?.stats || null,
    isLoading,
    error,
    respondToReview: respondToReview.mutateAsync,
    deleteResponse: deleteResponse.mutateAsync,
    isResponding: respondToReview.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  };
}
