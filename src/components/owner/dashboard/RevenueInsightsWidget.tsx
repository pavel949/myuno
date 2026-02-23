/**
 * RevenueInsightsWidget — Dashboard widget showing top pricing recommendations.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { getCurrencySymbol } from '@/lib/config/currencies';

interface PricingRecommendation {
  id: string;
  property_id: string;
  date_from: string;
  date_to: string;
  current_price: number;
  recommended_price: number;
  currency: string;
  confidence: number;
  reasoning: string;
  status: string;
}

export function RevenueInsightsWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isRu = language === 'ru';

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['pricing-recommendations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_recommendations')
        .select('*')
        .eq('status', 'pending')
        .order('confidence', { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data || []) as unknown as PricingRecommendation[];
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('pricing_recommendations')
        .update({ status } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-recommendations'] });
      toast({
        title: isRu ? 'Рекомендация обновлена' : 'Recommendation updated',
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          {isRu ? 'Рекомендации по ценам' : 'Revenue Insights'}
          <Badge variant="secondary" className="text-xs ml-auto">
            AI
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec) => {
          const diff = rec.recommended_price - rec.current_price;
          const diffPct = rec.current_price > 0
            ? Math.round((diff / rec.current_price) * 100)
            : 0;
          const isUp = diff > 0;
          const currSym = getCurrencySymbol(rec.currency || 'THB');

          return (
            <div key={rec.id} className="p-3 rounded-lg border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isUp
                    ? <TrendingUp className="w-4 h-4 text-green-600" />
                    : <TrendingDown className="w-4 h-4 text-amber-600" />
                  }
                  <span className="text-sm font-medium">
                    {currSym}{rec.current_price.toLocaleString()} → {currSym}{rec.recommended_price.toLocaleString()}
                  </span>
                </div>
                <Badge
                  variant={isUp ? 'default' : 'secondary'}
                  className={`text-xs ${isUp ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}`}
                >
                  {isUp ? '+' : ''}{diffPct}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{rec.reasoning}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{rec.date_from} — {rec.date_to}</span>
                <span className="ml-auto">{rec.confidence}% {isRu ? 'увер.' : 'conf.'}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs flex-1"
                  onClick={() => updateStatus.mutate({ id: rec.id, status: 'accepted' })}
                >
                  <Check className="w-3 h-3 mr-1" />
                  {isRu ? 'Принять' : 'Accept'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => updateStatus.mutate({ id: rec.id, status: 'rejected' })}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}

        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => navigate('/owner/pricing')}
        >
          {isRu ? 'Все рекомендации' : 'All recommendations'}
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
