import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/config/routes';

interface InquiryConfirmationProps {
  orderId: string;
  requestStatus?: string;
}

export function InquiryConfirmation({ orderId, requestStatus = 'pending' }: InquiryConfirmationProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
        <CheckCircle className="w-10 h-10 text-success" />
      </div>

      <h2 className="text-2xl font-bold mb-2">
        {requestStatus === 'accepted' ? (isRu ? 'Проживание подтверждено' : 'Stay confirmed') : ['cancelled', 'rejected'].includes(requestStatus) ? (isRu ? 'Запрос закрыт' : 'Request closed') : (isRu ? 'Запрос на проживание получен' : 'Stay request received')}
      </h2>

      <p className="text-muted-foreground mb-8 max-w-sm">
        {requestStatus === 'accepted' ? (isRu ? 'Управляющий подтвердил даты. Откройте запрос для подробностей.' : 'The property manager confirmed your dates. Open the request for details.') : ['cancelled', 'rejected'].includes(requestStatus) ? (isRu ? 'Этот запрос отменён или отклонён. Новый запрос не создавался.' : 'This request was cancelled or rejected. No new request was created.') : (isRu ? 'Даты пока не забронированы. Дождитесь подтверждения от управляющего.' : 'Dates are not reserved yet. Please wait for the property manager to confirm.')}
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button size="lg" onClick={() => navigate(APP_ROUTES.BOOKING_DETAIL(orderId))}>
          {isRu ? 'Открыть запрос' : 'View request'}
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate(APP_ROUTES.PROPERTY)}>
          {isRu ? 'Смотреть объекты' : 'Browse properties'}
        </Button>
      </div>
    </div>
  );
}
