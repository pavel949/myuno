import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MarketplaceReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  pros: string | null;
  cons: string | null;
  photos: string[] | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export function useProductReviews(productId: string) {
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('marketplace_reviews')
          .select('*')
          .eq('product_id', productId)
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (queryError) throw queryError;

        const reviewsData = (data || []) as MarketplaceReview[];
        setReviews(reviewsData);

        // Calculate stats
        if (reviewsData.length > 0) {
          const total = reviewsData.length;
          const sum = reviewsData.reduce((acc, r) => acc + r.rating, 0);
          const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          reviewsData.forEach(r => {
            dist[r.rating as keyof typeof dist]++;
          });
          setStats({
            averageRating: sum / total,
            totalReviews: total,
            ratingDistribution: dist
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) fetchReviews();
  }, [productId]);

  return { reviews, stats, isLoading, error };
}

export function useSubmitReview() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReview = async (data: {
    product_id: string;
    rating: number;
    title?: string;
    content?: string;
    pros?: string;
    cons?: string;
  }) => {
    if (!user) throw new Error('Must be logged in');
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('marketplace_reviews')
        .insert({
          ...data,
          user_id: user.id
        });
      
      if (error) throw error;
      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitReview, isSubmitting, canReview: !!user };
}
