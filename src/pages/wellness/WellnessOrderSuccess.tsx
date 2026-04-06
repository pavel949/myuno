import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CrossSellRecommendations } from '@/components/orders/CrossSellRecommendations';

export default function WellnessOrderSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }

    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      const query = supabase
        .from('orders' as any)
        .select('id, status, total_amount, currency, metadata, created_at')
        .eq('stripe_session_id', sessionId as string)
        .limit(1);
      const { data } = await query;

      if (data && data.length > 0) {
        setOrder(data[0]);
        setLoading(false);
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 2000);
      } else {
        setLoading(false);
      }
    };

    poll();
  }, [sessionId]);

  const vertical = order?.metadata?.vertical || 'beauty';
  const verticalLabels: Record<string, { en: string; ru: string; path: string }> = {
    beauty: { en: 'Beauty & Spa', ru: 'Красота и СПА', path: '/beauty' },
    fitness: { en: 'Fitness', ru: 'Фитнес', path: '/fitness' },
    medical: { en: 'Medical', ru: 'Медицина', path: '/medical' },
  };

  const info = verticalLabels[vertical] || verticalLabels.beauty;

  return (
    <AppLayout showBottomNav={false}>
      <PageContainer className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">
              {language === 'ru' ? 'Подтверждаем оплату...' : 'Confirming payment...'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>

            <div>
              <h1 className="text-2xl font-bold mb-2">
                {language === 'ru' ? 'Оплата прошла успешно!' : 'Payment Successful!'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'ru'
                  ? 'Ваша запись подтверждена. Мы отправим вам напоминание.'
                  : 'Your booking is confirmed. We\'ll send you a reminder.'}
              </p>
            </div>

            {order && (
              <div className="w-full bg-muted/50 rounded-xl p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {language === 'ru' ? 'Заказ' : 'Order'}
                  </span>
                  <span className="font-mono text-xs">{order.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {language === 'ru' ? 'Сумма' : 'Amount'}
                  </span>
                  <span className="font-semibold">
                    {order.total_amount?.toLocaleString()} {order.currency || 'THB'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {language === 'ru' ? 'Категория' : 'Category'}
                  </span>
                  <span>{language === 'ru' ? info.ru : info.en}</span>
                </div>
              </div>
            )}

            <CrossSellRecommendations orderType="wellness" className="mt-4" />

            <div className="flex flex-col gap-3 w-full mt-2">
              <Button onClick={() => navigate('/bookings')} className="w-full">
                {language === 'ru' ? 'Мои записи' : 'My Bookings'}
              </Button>
              <Button variant="outline" onClick={() => navigate(info.path)} className="w-full">
                {language === 'ru' ? `К разделу ${info.ru}` : `Browse ${info.en}`}
              </Button>
            </div>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
