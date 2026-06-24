import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrderBySession } from '@/data/repositories/orders/queries';
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

  const { order, isResolving: loading } = useOrderBySession<OrderRow>({
    sessionId,
    columns: 'id, order_number, status, total_amount, currency, metadata, created_at',
  });

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
