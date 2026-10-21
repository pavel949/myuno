/**
 * ThaiMyBookings — customer's Thai-service bookings with quick actions.
 */
import { Navigate, useNavigate } from 'react-router-dom';
import { CalendarDays, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { useCurrency } from '@/contexts/CurrencyContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { useMyThaiBookings, useUpdateThaiBookingStatus } from '@/hooks/thaiServices/useThaiServices';
import { THAI_BOOKING_STATUS_LABELS, customerCanCancel } from '@/lib/thaiServices/booking';

export default function ThaiMyBookings() {
  const enabled = useFeatureFlag('THAI_BUSINESS_LAYER');
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { data: bookings = [], isLoading } = useMyThaiBookings();
  const updateStatus = useUpdateThaiBookingStatus();

  if (!enabled) return <Navigate to={APP_ROUTES.DISCOVER} replace />;

  return (
    <div className="max-w-screen-sm mx-auto p-4">
      <h1 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <CalendarDays className="w-5 h-5" />{t('thai.myBookings.title')}
      </h1>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : bookings.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{t('thai.myBookings.empty')}</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const status = THAI_BOOKING_STATUS_LABELS[b.status];
            return (
              <div key={b.id} className="border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={b.status === 'cancelled' ? 'destructive' : 'secondary'}>
                    {pickLang(language, status)}
                  </Badge>
                  <span className="font-mono text-sm text-foreground">{formatPrice(b.total_amount_thb)}</span>
                </div>
                {b.date_time && (
                  <p className="text-sm text-muted-foreground">{new Date(b.date_time).toLocaleString()}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => navigate(APP_ROUTES.THAI_SERVICES_DETAIL(b.business_id))}>
                    <MessageCircle className="w-4 h-4 mr-1" />{t('thai.cta.openChat')}
                  </Button>
                  {customerCanCancel(b.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateStatus.mutate({ id: b.id, status: 'cancelled' })}
                      disabled={updateStatus.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />{t('thai.cta.cancel')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
