import React from 'react';
import { Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface EntityReviewsSummaryProps {
  entityType: string;
  entityId: string;
  compact?: boolean;
}

interface ReviewStats {
  avgRating: number;
  totalReviews: number;
  distribution: number[];
}

export function EntityReviewsSummary({ entityType, entityId, compact }: EntityReviewsSummaryProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: stats } = useQuery<ReviewStats>({
    queryKey: ['entity-reviews-stats', entityType, entityId],
    queryFn: async () => {
      // TS2589 workaround: reviews table causes deep type instantiation
      const { data, error } = await (supabase.from as any)('reviews')
        .select('rating')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('status', 'approved');

      if (error) throw error;

      const reviews = data || [];
      const total = reviews.length;
      if (total === 0) return { avgRating: 0, totalReviews: 0, distribution: [0, 0, 0, 0, 0] };

      const avg = reviews.reduce((s, r) => s + r.rating, 0) / total;
      const dist = [0, 0, 0, 0, 0];
      reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++; });

      return { avgRating: Math.round(avg * 10) / 10, totalReviews: total, distribution: dist };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!stats || stats.totalReviews === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Star className="w-4 h-4 fill-warning text-warning" />
        <span className="font-semibold text-sm text-foreground">{stats.avgRating}</span>
        <span className="text-xs text-muted-foreground">({stats.totalReviews})</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Overall */}
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold text-foreground">{stats.avgRating}</div>
        <div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= Math.round(stats.avgRating) ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stats.totalReviews} {isRu ? 'отзывов' : 'reviews'}
          </p>
        </div>
      </div>

      {/* Distribution bars */}
      <div className="space-y-1">
        {[5, 4, 3, 2, 1].map(star => {
          const count = stats.distribution[star - 1];
          const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-muted-foreground">{star}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-warning transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-right text-muted-foreground">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
