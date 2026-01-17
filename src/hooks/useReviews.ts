import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Review {
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
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface TrustBadge {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  icon: string;
  color: string;
}

interface UseReviewsOptions {
  itemType: string;
  itemId: string;
}

export const useReviews = ({ itemType, itemId }: UseReviewsOptions) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ average: 0, total: 0, distribution: [0, 0, 0, 0, 0] });

  const fetchReviews = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (checkMounted()) setIsLoading(true);
    try {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (!checkMounted()) return;

      const formatted: Review[] = (data || []).map(r => ({
        ...r,
        images: r.images || [],
      }));
      
      setReviews(formatted);

      // Calculate stats
      if (formatted.length > 0) {
        const total = formatted.length;
        const sum = formatted.reduce((acc, r) => acc + r.rating, 0);
        const average = sum / total;
        const distribution = [0, 0, 0, 0, 0];
        formatted.forEach(r => {
          distribution[r.rating - 1]++;
        });
        setStats({ average, total, distribution });
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      if (checkMounted()) setIsLoading(false);
    }
  }, [itemType, itemId]);

  useEffect(() => {
    let isMounted = true;
    fetchReviews(() => isMounted);
    return () => { isMounted = false; };
  }, [fetchReviews]);
  
  return { reviews, isLoading, stats, refetch: () => fetchReviews() };
};

export const useCreateReview = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const createReview = async (data: {
    itemType: string;
    itemId: string;
    rating: number;
    title?: string;
    content?: string;
    pros?: string;
    cons?: string;
    visitDate?: string;
  }) => {
    if (!user) throw new Error('Must be logged in to review');
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        item_type: data.itemType,
        item_id: data.itemId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        pros: data.pros,
        cons: data.cons,
        visit_date: data.visitDate,
      });
      
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error creating review:', err);
      throw err;
    } finally {
      if (isMountedRef.current) setIsSubmitting(false);
    }
  };

  return { createReview, isSubmitting };
};

export const useTrustBadges = (providerId?: string) => {
  const [badges, setBadges] = useState<TrustBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchBadges = async () => {
      if (isMounted) setIsLoading(true);
      try {
        if (providerId) {
          const { data } = await supabase
            .from('provider_badges')
            .select('badge_id, trust_badges(*)')
            .eq('provider_id', providerId);
          
          if (isMounted) {
            const formatted = (data || [])
              .map(pb => pb.trust_badges as unknown as TrustBadge)
              .filter(Boolean);
            setBadges(formatted);
          }
        } else {
          const { data } = await supabase
            .from('trust_badges')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');
          if (isMounted) setBadges(data || []);
        }
      } catch (err) {
        console.error('Error fetching badges:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchBadges();
    
    return () => { isMounted = false; };
  }, [providerId]);

  return { badges, isLoading };
};
