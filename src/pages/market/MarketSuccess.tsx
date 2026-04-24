import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { CrossSellRecommendations } from '@/components/orders/CrossSellRecommendations';
import { UnifiedSuccessLayout } from '@/components/orders/UnifiedSuccessLayout';

export default function MarketSuccess() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const isRu = language === 'ru';
  const orderNumber = searchParams.get('order_number') || undefined;

  const details = (
    <div>
      <p className="text-sm font-medium mb-2">
        {isRu ? 'Что дальше:' : 'What happens next:'}
      </p>
      <ul className="text-sm text-muted-foreground space-y-2">
        <li className="flex items-start gap-2">
          <span className="text-foreground font-semibold">1.</span>
          {isRu ? 'Продавец подготовит ваш заказ' : 'Seller prepares your order'}
        </li>
        <li className="flex items-start gap-2">
          <span className="text-foreground font-semibold">2.</span>
          {isRu ? 'Мы организуем доставку' : 'We arrange delivery'}
        </li>
        <li className="flex items-start gap-2">
          <span className="text-foreground font-semibold">3.</span>
          {isRu ? 'Вы получите заказ в указанное время' : 'You receive your order at the scheduled time'}
        </li>
      </ul>
    </div>
  );

  return (
    <UnifiedSuccessLayout
      orderNumber={orderNumber}
      note={{
        ru: 'Заказ оформлен. Мы свяжемся для подтверждения доставки.',
        en: 'Order placed. We will contact you to confirm delivery.',
      }}
      details={details}
      extras={<CrossSellRecommendations orderType="default" />}
      primaryHref="/bookings"
      secondaryHref="/market"
      secondaryLabel={{ ru: 'Продолжить покупки', en: 'Continue shopping' }}
    />
  );
}
