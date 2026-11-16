import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/config/routes';

interface InquiryConfirmationProps {
  orderId: string;
}

export function InquiryConfirmation({ orderId }: InquiryConfirmationProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
        <CheckCircle className="w-10 h-10 text-success" />
      </div>

      <h2 className="text-2xl font-bold mb-2">
        {isRu ? 'Заявка на аренду отправлена' : 'Rental request sent'}
      </h2>

      <p className="text-muted-foreground mb-8 max-w-sm">
        {isRu
          ? 'Это ещё не подтверждённое бронирование. Мы проверим выбранные даты и свяжемся с вами в WhatsApp в течение 24 часов.'
          : "This is not a confirmed booking yet. We'll check your dates and message you on WhatsApp within 24 hours."}
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button size="lg" onClick={() => navigate(APP_ROUTES.BOOKING_DETAIL(orderId))}>
          {isRu ? 'Открыть заявку' : 'View request'}
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate(APP_ROUTES.PROPERTY)}>
          {isRu ? 'Смотреть объекты' : 'Browse properties'}
        </Button>
      </div>
    </div>
  );
}
