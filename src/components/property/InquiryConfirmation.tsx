import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

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
        {isRu ? 'Запрос на просмотр отправлен' : 'Viewing request received'}
      </h2>

      <p className="text-muted-foreground mb-8 max-w-sm">
        {isRu
          ? 'Свяжемся с вами в WhatsApp в течение 24 часов, чтобы подтвердить время просмотра.'
          : "We'll message you on WhatsApp within 24 hours to confirm your viewing time."}
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button size="lg" onClick={() => navigate(`/bookings/${orderId}`)}>
          {isRu ? 'Открыть бронирование' : 'View booking'}
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate('/property')}>
          {isRu ? 'Смотреть объекты' : 'Browse properties'}
        </Button>
      </div>
    </div>
  );
}
