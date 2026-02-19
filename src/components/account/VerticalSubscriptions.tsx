import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Vertical {
  slug: string;
  nameRu: string;
  nameEn: string;
  emoji: string;
  descriptionRu: string;
  descriptionEn: string;
}

const VERTICALS: Vertical[] = [
  { slug: 'property', nameRu: 'Недвижимость', nameEn: 'Real Estate', emoji: '🏠', descriptionRu: 'Новые листинги, аренда, продажа', descriptionEn: 'New listings, rentals, sales' },
  { slug: 'yacht', nameRu: 'Яхты', nameEn: 'Yachts', emoji: '⛵', descriptionRu: 'Чартер, экскурсии, события', descriptionEn: 'Charter, tours, events' },
  { slug: 'restaurant', nameRu: 'Рестораны', nameEn: 'Restaurants', emoji: '🍽️', descriptionRu: 'Акции, новые заведения, события', descriptionEn: 'Deals, new venues, events' },
  { slug: 'flowers', nameRu: 'Цветы', nameEn: 'Flowers', emoji: '💐', descriptionRu: 'Сезонные букеты, акции', descriptionEn: 'Seasonal bouquets, deals' },
  { slug: 'services', nameRu: 'Услуги на дом', nameEn: 'Home Services', emoji: '🔧', descriptionRu: 'Клининг, ремонт, доставка', descriptionEn: 'Cleaning, repairs, delivery' },
  { slug: 'transfers', nameRu: 'Трансферы', nameEn: 'Transfers', emoji: '🚗', descriptionRu: 'Аэропорт, экскурсии, аренда авто', descriptionEn: 'Airport, tours, car rental' },
  { slug: 'market', nameRu: 'Маркетплейс', nameEn: 'Marketplace', emoji: '🛍️', descriptionRu: 'Новые товары, скидки', descriptionEn: 'New products, discounts' },
  { slug: 'experiences', nameRu: 'Экспириенс', nameEn: 'Experiences', emoji: '🌴', descriptionRu: 'Активности, туры, развлечения', descriptionEn: 'Activities, tours, entertainment' },
];

export function VerticalSubscriptions() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['vertical-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vertical_subscriptions')
        .select('vertical_slug, notify_email, notify_push');
      if (error) throw error;
      return data || [];
    },
  });

  const subscribedSlugs = new Set(subscriptions?.map(s => s.vertical_slug) || []);

  const toggleMutation = useMutation({
    mutationFn: async ({ slug, subscribed }: { slug: string; subscribed: boolean }) => {
      if (subscribed) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { error } = await supabase
          .from('vertical_subscriptions')
          .insert({ user_id: user.id, vertical_slug: slug, notify_email: true, notify_push: true });
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { error } = await supabase
          .from('vertical_subscriptions')
          .delete()
          .eq('vertical_slug', slug)
          .eq('user_id', user.id);
        if (error) throw error;
      }
    },
    onSuccess: (_, { subscribed, slug }) => {
      queryClient.invalidateQueries({ queryKey: ['vertical-subscriptions'] });
      const vertical = VERTICALS.find(v => v.slug === slug);
      const name = vertical ? (isRu ? vertical.nameRu : vertical.nameEn) : slug;
      toast.success(subscribed
        ? (isRu ? `Подписка на «${name}» активирована` : `Subscribed to ${name}`)
        : (isRu ? `Подписка на «${name}» отключена` : `Unsubscribed from ${name}`)
      );
    },
    onError: () => toast.error(isRu ? 'Ошибка при обновлении подписки' : 'Failed to update subscription'),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          {isRu ? 'Уведомления по категориям' : 'Category Notifications'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isRu
            ? 'Получайте уведомления о новых предложениях в выбранных категориях'
            : 'Get notified about new deals in selected categories'}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {VERTICALS.map((vertical) => {
              const isSubscribed = subscribedSlugs.has(vertical.slug);
              return (
                <div
                  key={vertical.slug}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{vertical.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{isRu ? vertical.nameRu : vertical.nameEn}</p>
                        {isSubscribed && (
                          <Badge variant="default" className="text-xs px-1.5 py-0">
                            {isRu ? 'вкл' : 'on'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isRu ? vertical.descriptionRu : vertical.descriptionEn}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isSubscribed}
                    onCheckedChange={(checked) => toggleMutation.mutate({ slug: vertical.slug, subscribed: checked })}
                    disabled={toggleMutation.isPending}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
