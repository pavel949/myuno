import { Clock, Users, MapPin, Calendar, CreditCard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface BookingSummaryProps {
  image?: string;
  title: string;
  subtitle?: string;
  duration?: string;
  maxParticipants?: number;
  location?: string;
  date?: Date;
  time?: string;
  participants?: number;
  price: number;
  originalPrice?: number;
  currency?: string;
  items?: { name: string; quantity: number; price: number }[];
  serviceFee?: number;
}

export function BookingSummary({
  image,
  title,
  subtitle,
  duration,
  maxParticipants,
  location,
  date,
  time,
  participants = 1,
  price,
  originalPrice,
  currency = 'THB',
  items,
  serviceFee = 0,
}: BookingSummaryProps) {
  const { language } = useLanguage();

  const currencySymbol = currency === 'THB' ? '฿' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₽';
  const total = items ? items.reduce((sum, i) => sum + i.price * i.quantity, 0) + serviceFee : price * participants;
  const hasDiscount = originalPrice && originalPrice > price;

  return (
    <div className="bg-card rounded-2xl border overflow-hidden">
      {/* Header with image */}
      <div className="flex gap-4 p-4 border-b">
        {image && (
          <img
            src={image}
            alt=""
            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base line-clamp-2">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {duration}
              </span>
            )}
            {maxParticipants && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {language === 'ru' ? 'макс' : 'max'} {maxParticipants}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Selected options */}
      {(date || time || participants > 1) && (
        <div className="p-4 border-b bg-muted/30">
          <div className="grid grid-cols-3 gap-3 text-sm">
            {date && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {language === 'ru' ? 'Дата' : 'Date'}
                </p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {format(date, 'd MMM', { locale: language === 'ru' ? ru : undefined })}
                </p>
              </div>
            )}
            {time && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {language === 'ru' ? 'Время' : 'Time'}
                </p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  {time}
                </p>
              </div>
            )}
            {participants > 1 && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {language === 'ru' ? 'Гостей' : 'Guests'}
                </p>
                <p className="font-medium flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  {participants}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Items breakdown */}
      {items && items.length > 0 && (
        <div className="p-4 border-b space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.name} {item.quantity > 1 && `×${item.quantity}`}
              </span>
              <span>{currencySymbol}{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          {serviceFee > 0 && (
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">
                {language === 'ru' ? 'Сервисный сбор' : 'Service fee'}
              </span>
              <span>{currencySymbol}{serviceFee.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Total */}
      <div className="p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <span className="font-medium">
            {language === 'ru' ? 'Итого' : 'Total'}
          </span>
          <div className="text-right">
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through mr-2">
                {currencySymbol}{(originalPrice * participants).toLocaleString()}
              </span>
            )}
            <span className="text-xl font-bold text-primary">
              {currencySymbol}{total.toLocaleString()}
            </span>
          </div>
        </div>
        {!items && participants > 1 && (
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {currencySymbol}{price.toLocaleString()} × {participants} {language === 'ru' ? 'чел.' : 'people'}
          </p>
        )}
      </div>
    </div>
  );
}
