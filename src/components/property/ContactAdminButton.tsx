import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface BookingDetails {
  propertyTitle: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalAmount: number;
  depositAmount: number;
  guestName: string;
  guestPhone: string;
}

interface ContactAdminButtonProps {
  bookingDetails: BookingDetails;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

export function ContactAdminButton({ 
  bookingDetails, 
  className,
  variant = 'outline' 
}: ContactAdminButtonProps) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const handleContact = () => {
    const {
      propertyTitle,
      checkIn,
      checkOut,
      guests,
      totalAmount,
      depositAmount,
      guestName,
      guestPhone,
    } = bookingDetails;

    // Format dates
    const checkInFormatted = format(checkIn, 'd MMM yyyy', { locale: isRu ? ru : undefined });
    const checkOutFormatted = format(checkOut, 'd MMM yyyy', { locale: isRu ? ru : undefined });

    // Build WhatsApp message
    const message = isRu
      ? `🏠 Запрос на бронирование недвижимости

📍 Объект: ${propertyTitle}
📅 Заезд: ${checkInFormatted}
📅 Выезд: ${checkOutFormatted}
👥 Гостей: ${guests}

💰 Полная стоимость: ${formatPrice(totalAmount)}
💳 Предоплата 10%: ${formatPrice(depositAmount)}

👤 Имя: ${guestName}
📱 Телефон: ${guestPhone}

Хочу обсудить способ оплаты предоплаты.`
      : `🏠 Property Booking Request

📍 Property: ${propertyTitle}
📅 Check-in: ${checkInFormatted}
📅 Check-out: ${checkOutFormatted}
👥 Guests: ${guests}

💰 Total: ${formatPrice(totalAmount)}
💳 10% Deposit: ${formatPrice(depositAmount)}

👤 Name: ${guestName}
📱 Phone: ${guestPhone}

I would like to discuss payment options for the deposit.`;

    // myUNO WhatsApp number (Thailand)
    const whatsappNumber = '66612345678'; // Replace with actual myUNO number
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleContact}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      {isRu ? 'Обсудить с myUNO' : 'Discuss with myUNO'}
    </Button>
  );
}
