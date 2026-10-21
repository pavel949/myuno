import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Shield, Handshake, User, MapPin } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { APP_ROUTES } from '@/lib/config/routes';
import type { TransferFormData } from './types';

interface TransferSuccessProps {
  language: string;
  formData: TransferFormData;
  createdOrderNumber: string | null;
}

export function TransferSuccess({ language, formData, createdOrderNumber }: TransferSuccessProps) {
  const navigate = useNavigate();

  return (
    <AppLayout showBottomNav={false}>
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[80vh]">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success/20 to-success/40 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <Check className="w-12 h-12 text-success" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2 text-center">
          {language === 'ru' ? 'Трансфер забронирован!' : 'Transfer Booked!'}
        </h2>
        {createdOrderNumber && (
          <p className="text-lg font-semibold text-primary mb-2">#{createdOrderNumber}</p>
        )}
        <p className="text-muted-foreground text-center max-w-sm mb-2">
          {language === 'ru'
            ? `Рейс ${formData.flightNumber} • ${formData.arrivalDate}`
            : `Flight ${formData.flightNumber} • ${formData.arrivalDate}`}
        </p>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-success/10 text-success">
            <Shield className="w-3 h-3 mr-1" />
            {language === 'ru' ? 'Подтверждено' : 'Confirmed'}
          </Badge>
          {formData.paymentMethod === 'concierge_advance' && (
            <Badge variant="secondary" className="bg-warning/10 text-warning">
              <Handshake className="w-3 h-3 mr-1" />
              myUNO
            </Badge>
          )}
        </div>

        {formData.paymentMethod === 'concierge_advance' && (
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
            {language === 'ru'
              ? 'Мы оплатим за вас. После трансфера вы вернёте сумму удобным способом.'
              : "We'll pay for you. Return the amount after the transfer."}
          </p>
        )}

        {formData.direction === 'from-airport' && (
          <div className="w-full max-w-sm p-4 rounded-none bg-card border border-border/50 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Имя на табличке' : 'Name on sign'}
                </p>
                <p className="font-semibold text-lg">{formData.meetingSignName || formData.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <MapPin className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Адрес назначения' : 'Destination'}
                </p>
                <p className="font-medium">{formData.destinationAddress}</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-muted-foreground text-center max-w-sm mb-8">
          {language === 'ru'
            ? 'Водитель встретит вас с табличкой у выхода из терминала.'
            : 'Driver will meet you with a sign at the terminal exit.'}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(APP_ROUTES.TRANSPORT)}>
            {language === 'ru' ? 'К транспорту' : 'Browse More'}
          </Button>
          <Button onClick={() => navigate(APP_ROUTES.BOOKINGS)}>
            {language === 'ru' ? 'Мои брони' : 'My Bookings'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
