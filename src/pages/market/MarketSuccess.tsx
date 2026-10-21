import { withMarketAvailability } from '@/components/market/MarketAvailabilityGate';
import { useSearchParams } from 'react-router-dom';
import { useOrderReturnRead } from '@/hooks/useOrderReturnRead';
import { CrossSellRecommendations } from '@/components/orders/CrossSellRecommendations';
import { UnifiedSuccessLayout } from '@/components/orders/UnifiedSuccessLayout';

function MarketSuccess() {
  const [searchParams] = useSearchParams();

  const { order, confirmed, isLoading, status } = useOrderReturnRead({
    orderTypes: ['market'], orderId: searchParams.get('order_id'),
    orderNumber: searchParams.get('order_number'), sessionId: searchParams.get('session_id'),
  });

  return (
    <UnifiedSuccessLayout
      isLoading={isLoading}
      status={status}
      hideWhatsApp={!order}
      orderNumber={order?.order_number}
      note={{
        ru: 'Проверьте состав заказа и условия доставки в разделе заказов.',
        en: 'Check the order contents and delivery arrangements in My orders.',
      }}
      extras={confirmed ? <CrossSellRecommendations orderType="default" /> : undefined}
      primaryHref="/bookings"
      secondaryHref="/market"
      secondaryLabel={{ ru: 'Продолжить покупки', en: 'Continue shopping' }}
    />
  );
}

const AvailableMarketSuccess = withMarketAvailability(MarketSuccess);
export default AvailableMarketSuccess;
