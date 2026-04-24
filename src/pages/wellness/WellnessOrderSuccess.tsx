import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { CrossSellRecommendations } from '@/components/orders/CrossSellRecommendations';
import { UnifiedSuccessLayout } from '@/components/orders/UnifiedSuccessLayout';

interface OrderRow {
  id: string;
  order_number: string | null;
  status: string;
  total_amount: number;
  currency: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const VERTICAL_PATHS: Record<string, { en: string; ru: string; path: string }> = {
  beauty: { en: 'Beauty & Spa', ru: 'Красота и СПА', path: '/beauty' },
  fitness: { en: 'Fitness', ru: 'Фитнес', path: '/fitness' },
  medical: { en: 'Medical', ru: 'Медицина', path: '/medical' },
};

export default function WellnessOrderSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(!!sessionId);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }

    let attempts = 0;
    const maxAttempts = 10;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const { data } = await (supabase
        .from('orders') as any)
        .select('id, order_number, status, total_amount, currency, metadata, created_at')
        .eq('stripe_session_id', sessionId)
        .limit(1);


      if (data && data.length > 0) {
        setOrder(data[0] as OrderRow);
        setLoading(false);
        return;
      }
      if (++attempts < maxAttempts) {
        timer = setTimeout(poll, 2000);
      } else {
        setLoading(false);
      }
    };

    poll();
    return () => clearTimeout(timer);
  }, [sessionId]);

  const vertical = String(order?.metadata?.vertical || 'beauty');
  const info = VERTICAL_PATHS[vertical] || VERTICAL_PATHS.beauty;

  const details = order ? (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{isRu ? 'Сумма' : 'Amount'}</span>
        <span className="font-semibold">
          {order.total_amount?.toLocaleString()} {order.currency || 'THB'}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{isRu ? 'Категория' : 'Category'}</span>
        <span>{isRu ? info.ru : info.en}</span>
      </div>
    </div>
  ) : null;

  return (
    <UnifiedSuccessLayout
      isLoading={loading}
      orderNumber={order?.order_number || undefined}
      note={{
        ru: 'Запись подтверждена. Мы отправим напоминание перед визитом.',
        en: "Booking confirmed. We'll send a reminder before your visit.",
      }}
      details={details}
      extras={<CrossSellRecommendations orderType="wellness" />}
      primaryHref="/bookings"
      secondaryHref={info.path}
      secondaryLabel={{
        ru: `К разделу ${info.ru}`,
        en: `Browse ${info.en}`,
      }}
    />
  );
}
