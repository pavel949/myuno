/**
 * @component CrossSellRecommendations
 * @description "You might also like" widget shown after order confirmation.
 * Fetches recommendations from booking_cross_sell_offers or shows category-based suggestions.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Category-based recommendation mapping
const RELATED_SERVICES: Record<string, Array<{ slug: string; labelEn: string; labelRu: string; icon: string; path: string }>> = {
  flowers: [
    { slug: 'restaurant', labelEn: 'Book a Restaurant', labelRu: 'Забронировать ресторан', icon: '🍽️', path: '/restaurants' },
    { slug: 'transport', labelEn: 'Airport Transfer', labelRu: 'Трансфер из аэропорта', icon: '🚗', path: '/transport' },
  ],
  restaurant: [
    { slug: 'flowers', labelEn: 'Send Flowers', labelRu: 'Отправить цветы', icon: '💐', path: '/flowers' },
    { slug: 'transport', labelEn: 'Book a Ride', labelRu: 'Заказать такси', icon: '🚗', path: '/transport' },
  ],
  cleaning: [
    { slug: 'beauty', labelEn: 'Beauty & Spa', labelRu: 'Красота и Спа', icon: '💅', path: '/beauty' },
    { slug: 'pets', labelEn: 'Pet Services', labelRu: 'Услуги для питомцев', icon: '🐾', path: '/pets' },
  ],
  transport: [
    { slug: 'flowers', labelEn: 'Send Flowers', labelRu: 'Отправить цветы', icon: '💐', path: '/flowers' },
    { slug: 'experiences', labelEn: 'Tours & Activities', labelRu: 'Экскурсии', icon: '🗺️', path: '/experiences' },
  ],
  default: [
    { slug: 'flowers', labelEn: 'Flowers & Gifts', labelRu: 'Цветы и подарки', icon: '💐', path: '/flowers' },
    { slug: 'restaurant', labelEn: 'Restaurants', labelRu: 'Рестораны', icon: '🍽️', path: '/restaurants' },
    { slug: 'experiences', labelEn: 'Experiences', labelRu: 'Экскурсии', icon: '🗺️', path: '/experiences' },
  ],
};

interface CrossSellRecommendationsProps {
  orderType?: string;
  orderId?: string;
  className?: string;
}

export function CrossSellRecommendations({ orderType, orderId, className }: CrossSellRecommendationsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();

  const suggestions = RELATED_SERVICES[orderType || ''] || RELATED_SERVICES.default;

  return (
    <Card className={cn('border-accent/30', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          {isRu ? 'Вам также может понравиться' : 'You might also like'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.map((s) => (
          <button
            key={s.slug}
            onClick={() => navigate(s.path)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
          >
            <span className="text-2xl">{s.icon}</span>
            <span className="flex-1 font-medium text-sm">
              {isRu ? s.labelRu : s.labelEn}
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
