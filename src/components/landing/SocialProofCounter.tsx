/**
 * SocialProofCounter — live counter for landing pages
 * "1,200+ transfers completed" style counter
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, Users, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialProofCounterProps {
  vertical?: string; // 'transfer', 'property', etc.
  className?: string;
  variant?: 'inline' | 'banner';
}

export function SocialProofCounter({ 
  vertical, 
  className,
  variant = 'inline',
}: SocialProofCounterProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: stats } = useQuery({
    queryKey: ['social-proof-stats', vertical],
    queryFn: async () => {
      // Get completed orders count
      let query = supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed');
      
      if (vertical) {
        query = query.eq('vertical', vertical);
      }
      
      const { count: ordersCount } = await query;

      // Get reviews count and avg rating
      let reviewQuery = supabase
        .from('reviews')
        .select('rating', { count: 'exact' })
        .eq('is_approved', true);
      
      if (vertical) {
        reviewQuery = reviewQuery.eq('item_type', vertical);
      }

      const { data: reviews, count: reviewsCount } = await reviewQuery;
      
      const avgRating = reviews?.length 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 4.8;

      // Round up for social proof
      const displayOrders = Math.max(ordersCount || 0, 50); // minimum display
      const roundedOrders = Math.ceil(displayOrders / 100) * 100;

      return {
        ordersCount: roundedOrders,
        reviewsCount: reviewsCount || 0,
        avgRating: Math.round(avgRating * 10) / 10,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  if (!stats) return null;

  const metrics = [
    {
      icon: CheckCircle,
      value: `${stats.ordersCount.toLocaleString()}+`,
      label: isRu ? 'заказов выполнено' : 'orders completed',
    },
    ...(stats.reviewsCount > 0 ? [{
      icon: Star,
      value: stats.avgRating.toString(),
      label: isRu ? `из ${stats.reviewsCount} отзывов` : `from ${stats.reviewsCount} reviews`,
    }] : []),
  ];

  if (variant === 'banner') {
    return (
      <div className={cn(
        'flex items-center justify-center gap-6 py-3 px-4 bg-muted/40 rounded-none',
        className
      )}>
        {metrics.map((m, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-border">·</span>}
            <div className="flex items-center gap-2">
              <m.icon className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">{m.value}</span>
              <span className="text-xs text-muted-foreground">{m.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {metrics.map((m, i) => (
        <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
          <m.icon className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs">
            <span className="font-semibold text-foreground">{m.value}</span>{' '}
            {m.label}
          </span>
        </div>
      ))}
    </div>
  );
}
