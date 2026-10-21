import { useSearchParams } from 'react-router-dom';
import { useOrderReturnRead } from '@/hooks/useOrderReturnRead';
import { useLanguage } from '@/contexts/LanguageContext';
import { CrossSellRecommendations } from '@/components/orders/CrossSellRecommendations';
import { UnifiedSuccessLayout } from '@/components/orders/UnifiedSuccessLayout';

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

  const { order, confirmed, isLoading: loading, status } = useOrderReturnRead({ orderTypes: ['beauty', 'fitness', 'medical'], sessionId });

  const vertical = typeof order?.metadata?.vertical === 'string' ? order.metadata.vertical : undefined;
  const info = vertical ? VERTICAL_PATHS[vertical] : undefined;

  const details = order ? (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{isRu ? 'Сумма' : 'Amount'}</span>
        <span className="font-semibold">
          {order.total_amount?.toLocaleString()} {order.currency}
        </span>
      </div>
      {info && <div className="flex justify-between">
        <span className="text-muted-foreground">{isRu ? 'Категория' : 'Category'}</span>
        <span>{isRu ? info.ru : info.en}</span>
      </div>}
    </div>
  ) : null;

  return (
    <UnifiedSuccessLayout
      isLoading={loading}
      status={status}
      hideWhatsApp={!order}
      orderNumber={order?.order_number || undefined}
      note={{
        ru: 'Статус относится к заказу. Время и исполнитель услуги требуют отдельного подтверждения.',
        en: 'This is the order status. Service time and provider require separate confirmation.',
      }}
      details={details}
      extras={confirmed ? <CrossSellRecommendations orderType="wellness" /> : undefined}
      primaryHref="/bookings"
      secondaryHref={info?.path || '/services'}
      secondaryLabel={{
        ru: info ? `К разделу ${info.ru}` : 'К услугам',
        en: info ? `Browse ${info.en}` : 'Browse services',
      }}
    />
  );
}
