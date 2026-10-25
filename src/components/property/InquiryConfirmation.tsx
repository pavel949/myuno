import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/config/routes';

interface InquiryConfirmationProps {
  orderId: string;
  /** Set only after the PR160 canonical reader validates order + exact hold. */
  propertyReservation?: boolean;
}

export function InquiryConfirmation({ orderId, propertyReservation = false }: InquiryConfirmationProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
        <CheckCircle className="w-10 h-10 text-success" />
      </div>

      <h2 className="text-2xl font-bold mb-2">
        {isRu ? 'Запрос отправлен' : 'Request submitted'}
      </h2>

      <p className="text-muted-foreground mb-8 max-w-sm">
        {isRu
          ? 'Проверьте сохранённый статус запроса. Отправка запроса не означает подтверждение бронирования.'
          : 'Check the persisted request status. Submitting a request does not mean the reservation is confirmed.'}
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button size="lg" onClick={() => navigate(`${APP_ROUTES.BOOKING_DETAIL(orderId)}?${propertyReservation ? 'propertyReservation' : 'propertyOrder'}=1`)}>
          {isRu ? 'Проверить статус' : 'Check status'}
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate(APP_ROUTES.PROPERTY)}>
          {isRu ? 'Смотреть объекты' : 'Browse properties'}
        </Button>
      </div>
    </div>
  );
}
