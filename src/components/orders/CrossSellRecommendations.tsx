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
const RELATED_SERVICES: Record<string, Array<{ slug: string; labelEn: string; labelRu: string; labelTh: string; icon: string; path: string }>> = {
  flowers: [
    { slug: 'restaurant', labelEn: 'Book a Restaurant', labelRu: 'Забронировать ресторан', labelTh: 'จองร้านอาหาร', icon: '🍽️', path: '/restaurants' },
    { slug: 'transport', labelEn: 'Airport Transfer', labelRu: 'Трансфер из аэропорта', labelTh: 'รับส่งสนามบิน', icon: '🚗', path: '/transport' },
  ],
  restaurant: [
    { slug: 'flowers', labelEn: 'Send Flowers', labelRu: 'Отправить цветы', labelTh: 'ส่งดอกไม้', icon: '💐', path: '/flowers' },
    { slug: 'transport', labelEn: 'Book a Ride', labelRu: 'Заказать такси', labelTh: 'เรียกรถ', icon: '🚗', path: '/transport' },
  ],
  cleaning: [
    { slug: 'beauty', labelEn: 'Beauty & Spa', labelRu: 'Красота и Спа', labelTh: 'ความงามและสปา', icon: '💅', path: '/beauty' },
    { slug: 'flowers', labelEn: 'Send Flowers', labelRu: 'Отправить цветы', labelTh: 'ส่งดอกไม้', icon: '💐', path: '/flowers' },
  ],
  transport: [
    { slug: 'flowers', labelEn: 'Send Flowers', labelRu: 'Отправить цветы', labelTh: 'ส่งดอกไม้', icon: '💐', path: '/flowers' },
    { slug: 'experiences', labelEn: 'Tours & Activities', labelRu: 'Экскурсии', labelTh: 'ทัวร์และกิจกรรม', icon: '🗺️', path: '/experiences' },
  ],
  yacht: [
    { slug: 'restaurant', labelEn: 'Book Dinner', labelRu: 'Забронировать ужин', labelTh: 'จองมื้อค่ำ', icon: '🍽️', path: '/restaurants' },
    { slug: 'flowers', labelEn: 'Flowers & Gifts', labelRu: 'Цветы и подарки', labelTh: 'ดอกไม้และของขวัญ', icon: '💐', path: '/flowers' },
    { slug: 'transport', labelEn: 'Airport Transfer', labelRu: 'Трансфер', labelTh: 'รับส่งสนามบิน', icon: '🚗', path: '/transport' },
  ],
  yacht_charter: [
    { slug: 'restaurant', labelEn: 'Book Dinner', labelRu: 'Забронировать ужин', labelTh: 'จองมื้อค่ำ', icon: '🍽️', path: '/restaurants' },
    { slug: 'flowers', labelEn: 'Flowers & Gifts', labelRu: 'Цветы и подарки', labelTh: 'ดอกไม้และของขวัญ', icon: '💐', path: '/flowers' },
    { slug: 'transport', labelEn: 'Airport Transfer', labelRu: 'Трансфер', labelTh: 'รับส่งสนามบิน', icon: '🚗', path: '/transport' },
  ],
  legal: [
    { slug: 'visa', labelEn: 'Visa Services', labelRu: 'Визовые услуги', labelTh: 'บริการวีซ่า', icon: '📋', path: '/legal/visa' },
    { slug: 'property', labelEn: 'Property Search', labelRu: 'Поиск недвижимости', labelTh: 'ค้นหาอสังหาริมทรัพย์', icon: '🏠', path: '/property' },
  ],
  legal_consultation: [
    { slug: 'visa', labelEn: 'Visa Services', labelRu: 'Визовые услуги', labelTh: 'บริการวีซ่า', icon: '📋', path: '/legal/visa' },
    { slug: 'property', labelEn: 'Property Search', labelRu: 'Поиск недвижимости', labelTh: 'ค้นหาอสังหาริมทรัพย์', icon: '🏠', path: '/property' },
  ],
  pet_service: [
    { slug: 'cleaning', labelEn: 'Home Cleaning', labelRu: 'Уборка квартиры', labelTh: 'ทำความสะอาดบ้าน', icon: '🧹', path: '/cleaning' },
    { slug: 'medical', labelEn: 'Find a Doctor', labelRu: 'Найти врача', labelTh: 'ค้นหาแพทย์', icon: '🏥', path: '/medical' },
  ],
  beauty: [
    { slug: 'restaurant', labelEn: 'Book a Restaurant', labelRu: 'Забронировать ресторан', labelTh: 'จองร้านอาหาร', icon: '🍽️', path: '/restaurants' },
    { slug: 'flowers', labelEn: 'Flowers & Gifts', labelRu: 'Цветы и подарки', labelTh: 'ดอกไม้และของขวัญ', icon: '💐', path: '/flowers' },
  ],
  wellness: [
    { slug: 'restaurant', labelEn: 'Book a Restaurant', labelRu: 'Забронировать ресторан', labelTh: 'จองร้านอาหาร', icon: '🍽️', path: '/restaurants' },
    { slug: 'experiences', labelEn: 'Tours & Activities', labelRu: 'Экскурсии', labelTh: 'ทัวร์และกิจกรรม', icon: '🗺️', path: '/experiences' },
  ],
  service: [
    { slug: 'cleaning', labelEn: 'Home Cleaning', labelRu: 'Уборка квартиры', labelTh: 'ทำความสะอาดบ้าน', icon: '🧹', path: '/cleaning' },
    { slug: 'beauty', labelEn: 'Beauty & Spa', labelRu: 'Красота и Спа', labelTh: 'ความงามและสปา', icon: '💅', path: '/beauty' },
  ],
  event: [
    { slug: 'restaurant', labelEn: 'Book Dinner', labelRu: 'Забронировать ужин', labelTh: 'จองมื้อค่ำ', icon: '🍽️', path: '/restaurants' },
    { slug: 'transport', labelEn: 'Book a Ride', labelRu: 'Заказать такси', labelTh: 'เรียกรถ', icon: '🚗', path: '/transport' },
    { slug: 'flowers', labelEn: 'Flowers & Gifts', labelRu: 'Цветы и подарки', labelTh: 'ดอกไม้และของขวัญ', icon: '💐', path: '/flowers' },
  ],
  default: [
    { slug: 'flowers', labelEn: 'Flowers & Gifts', labelRu: 'Цветы и подарки', labelTh: 'ดอกไม้และของขวัญ', icon: '💐', path: '/flowers' },
    { slug: 'restaurant', labelEn: 'Restaurants', labelRu: 'Рестораны', labelTh: 'ร้านอาหาร', icon: '🍽️', path: '/restaurants' },
    { slug: 'experiences', labelEn: 'Experiences', labelRu: 'Экскурсии', labelTh: 'ประสบการณ์', icon: '🗺️', path: '/experiences' },
  ],
};

interface CrossSellRecommendationsProps {
  orderType?: string;
  orderId?: string;
  className?: string;
}

export function CrossSellRecommendations({ orderType, orderId, className }: CrossSellRecommendationsProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const suggestions = RELATED_SERVICES[orderType || ''] || RELATED_SERVICES.default;

  return (
    <Card className={cn('border-accent/30', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          {language === 'ru' ? 'Вам также может понравиться' : language === 'th' ? 'คุณอาจสนใจสิ่งนี้' : 'You might also like'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.map((s) => (
          <button
            key={s.slug}
            onClick={() => navigate(s.path)}
            className="w-full flex items-center gap-3 p-3 rounded-none hover:bg-muted/50 transition-colors text-left group"
          >
            <span className="text-2xl">{s.icon}</span>
            <span className="flex-1 font-medium text-sm">
              {language === 'ru' ? s.labelRu : language === 'th' ? s.labelTh : s.labelEn}
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
