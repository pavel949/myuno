import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ChevronRight } from 'lucide-react';

/**
 * Shows personalized recommendations based on the user's order history.
 * Surfaces categories they've used before with "order again" style suggestions,
 * plus trending services they haven't tried.
 */
export function PersonalRecommendations() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const { data, isLoading } = useQuery({
    queryKey: ['personal-recommendations', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get user's recent order categories
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('order_items(category, item_name, item_id)')
        .eq('customer_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get popular services the user hasn't tried
      const { data: trending } = await supabase
        .from('services')
        .select('id, name_en, name_ru, category_id, price, currency, images')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6);

      // Extract categories from orders
      const usedCategories = new Set<string>();
      const reOrderItems: Array<{ name: string; category: string; id: string }> = [];
      
      recentOrders?.forEach(order => {
        const items = order.order_items as any[];
        items?.forEach(item => {
          if (item.category) usedCategories.add(item.category);
          if (item.item_name && reOrderItems.length < 3) {
            reOrderItems.push({ 
              name: item.item_name, 
              category: item.category || '', 
              id: item.item_id || '' 
            });
          }
        });
      });

      // Filter trending to things user hasn't ordered
      const suggestions = trending?.filter(s => !usedCategories.has(s.category_id || '')).slice(0, 4) || [];

      return { reOrderItems, suggestions, hasHistory: usedCategories.size > 0 };
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-3">
          <Skeleton className="h-24 w-40 rounded-xl" />
          <Skeleton className="h-24 w-40 rounded-xl" />
          <Skeleton className="h-24 w-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data || (!data.hasHistory && data.suggestions.length === 0)) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">
          {isRu ? 'Рекомендации для вас' : 'Recommended for you'}
        </h2>
      </div>

      {/* Re-order suggestions */}
      {data.reOrderItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Заказать снова' : 'Order again'}
          </p>
          <div className="space-y-1">
            {data.reOrderItems.map((item, i) => (
              <button
                key={i}
                onClick={() => navigate('/discover')}
                className="w-full flex items-center gap-3 py-3 hover:opacity-70 transition-opacity"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                  🔄
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending services */}
      {data.suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Попробуйте новое' : 'Try something new'}
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none lg:grid lg:grid-cols-3 xl:grid-cols-4 lg:mx-0 lg:px-0 lg:overflow-visible">
            {data.suggestions.map((service) => (
              <button
                key={service.id}
                onClick={() => navigate(`/service/${service.id}`)}
                className="min-w-[160px] rounded-xl border bg-card overflow-hidden hover:shadow-elevation-2 transition-shadow group"
              >
                {service.images?.[0] ? (
                  <div className="h-20 overflow-hidden">
                    <img
                      src={service.images[0]}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="h-20 bg-muted flex items-center justify-center text-2xl">✨</div>
                )}
                <div className="p-3 text-left">
                  <p className="text-sm font-medium truncate">
                    {isRu ? service.name_ru : service.name_en}
                  </p>
                  {service.price && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {service.currency || '฿'}{service.price.toLocaleString()}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
