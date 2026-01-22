import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SuperhostMetrics {
  id: string;
  owner_id: string;
  avg_rating: number;
  total_reviews: number;
  total_bookings: number;
  completed_bookings: number;
  cancellation_rate: number;
  avg_response_time_minutes: number | null;
  response_rate: number;
  review_reply_rate: number;
  is_superhost: boolean;
  superhost_since: string | null;
  last_evaluated_at: string | null;
}

export interface SuperhostRequirements {
  minRating: number;
  minBookings: number;
  maxCancellationRate: number;
  minResponseRate: number;
}

export const SUPERHOST_REQUIREMENTS: SuperhostRequirements = {
  minRating: 4.8,
  minBookings: 10,
  maxCancellationRate: 1, // 1%
  minResponseRate: 90, // 90%
};

export interface SuperhostProgress {
  rating: { current: number; required: number; met: boolean; percent: number };
  bookings: { current: number; required: number; met: boolean; percent: number };
  cancellationRate: { current: number; required: number; met: boolean; percent: number };
  responseRate: { current: number; required: number; met: boolean; percent: number };
  overallProgress: number;
  requirementsMet: number;
  totalRequirements: number;
}

export function useSuperhostStatus() {
  const { user } = useAuth();

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['superhost-metrics', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('owner_performance_metrics')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as SuperhostMetrics | null;
    },
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute
  });

  // Calculate progress towards Superhost status
  const progress: SuperhostProgress | null = metrics ? calculateProgress(metrics) : null;

  return {
    metrics,
    progress,
    isSuperhost: metrics?.is_superhost || false,
    superhostSince: metrics?.superhost_since,
    isLoading,
    error,
  };
}

function calculateProgress(metrics: SuperhostMetrics): SuperhostProgress {
  const req = SUPERHOST_REQUIREMENTS;

  const rating = {
    current: Number(metrics.avg_rating) || 0,
    required: req.minRating,
    met: Number(metrics.avg_rating) >= req.minRating,
    percent: Math.min(100, (Number(metrics.avg_rating) / req.minRating) * 100),
  };

  const bookings = {
    current: metrics.completed_bookings || 0,
    required: req.minBookings,
    met: (metrics.completed_bookings || 0) >= req.minBookings,
    percent: Math.min(100, ((metrics.completed_bookings || 0) / req.minBookings) * 100),
  };

  const cancellationRate = {
    current: Number(metrics.cancellation_rate) || 0,
    required: req.maxCancellationRate,
    met: (Number(metrics.cancellation_rate) || 0) <= req.maxCancellationRate,
    percent: req.maxCancellationRate > 0 
      ? Math.min(100, Math.max(0, (1 - (Number(metrics.cancellation_rate) || 0) / (req.maxCancellationRate * 2)) * 100))
      : 100,
  };

  const responseRate = {
    current: Number(metrics.response_rate) || 0,
    required: req.minResponseRate,
    met: (Number(metrics.response_rate) || 0) >= req.minResponseRate,
    percent: Math.min(100, ((Number(metrics.response_rate) || 0) / req.minResponseRate) * 100),
  };

  const requirementsMet = [rating.met, bookings.met, cancellationRate.met, responseRate.met].filter(Boolean).length;
  const totalRequirements = 4;

  return {
    rating,
    bookings,
    cancellationRate,
    responseRate,
    overallProgress: (requirementsMet / totalRequirements) * 100,
    requirementsMet,
    totalRequirements,
  };
}

// Benefits for Superhosts
export const SUPERHOST_BENEFITS = {
  en: [
    { icon: 'trophy', title: 'Priority in Search', description: 'Your listings appear higher in search results' },
    { icon: 'badge', title: 'Superhost Badge', description: 'Exclusive badge on your profile and listings' },
    { icon: 'percent', title: 'Reduced Commission', description: 'Lower platform fees on bookings' },
    { icon: 'headphones', title: 'Priority Support', description: 'Dedicated support line for Superhosts' },
    { icon: 'gift', title: 'Annual Rewards', description: 'Exclusive gifts and travel credits' },
  ],
  ru: [
    { icon: 'trophy', title: 'Приоритет в поиске', description: 'Ваши объекты выше в результатах поиска' },
    { icon: 'badge', title: 'Значок Суперхозяина', description: 'Эксклюзивный значок в профиле и объявлениях' },
    { icon: 'percent', title: 'Сниженная комиссия', description: 'Уменьшенные платформенные сборы' },
    { icon: 'headphones', title: 'Приоритетная поддержка', description: 'Выделенная линия поддержки' },
    { icon: 'gift', title: 'Ежегодные награды', description: 'Эксклюзивные подарки и кредиты' },
  ],
};
