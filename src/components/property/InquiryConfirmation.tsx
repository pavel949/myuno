import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/config/routes';

interface InquiryConfirmationProps {
  orderId: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
}

export function InquiryConfirmation({ orderId, status = 'pending' }: InquiryConfirmationProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
        <CheckCircle className="w-10 h-10 text-success" />
      </div>

      <h2 className="text-2xl font-bold mb-2">
        {status === 'cancelled' ? (isRu ? 'Бронирование отменено' : 'Reservation cancelled')
          : status === 'confirmed' ? (isRu ? 'Бронирование подтверждено' : 'Reservation confirmed')
          : (isRu ? 'Запрос на бронирование сохранён' : 'Reservation request saved')}
      </h2>

      <p className="text-muted-foreground mb-8 max-w-sm">
        {isRu ? 'Откройте бронирование, чтобы проверить сохранённый статус и управлять им. Оплата не списывалась.'
          : 'Open the reservation to check its persisted status and manage it. No payment has been collected.'}
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button size="lg" onClick={() => navigate(APP_ROUTES.PROPERTY_RESERVATION(orderId))}>
          {isRu ? 'Открыть бронирование' : 'View booking'}
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate(APP_ROUTES.PROPERTY)}>
          {isRu ? 'Смотреть объекты' : 'Browse properties'}
        </Button>
      </div>
    </div>
  );
}
