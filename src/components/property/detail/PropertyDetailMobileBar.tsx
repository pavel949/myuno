/**
 * PropertyDetailMobileBar — Fixed bottom CTA for the property detail page on mobile.
 * Shows price + "Reserve / Select dates / Book now" or "Request consultation" for sale listings.
 */
import { useNavigate } from 'react-router-dom';
import { Phone, Calendar as CalendarIcon, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { MessageHostButton } from '@/components/property';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { pluralizeNights } from '@/lib/i18n/pluralize';
import { APP_ROUTES } from '@/lib/config/routes';

interface PropertyDetailMobileBarProps {
  propertyId: string;
  isSaleListing: boolean;
  salePrice: number;
  pricePerNight: number;
  ownershipLabel?: string;
  titleEn?: string | null;
  titleRu?: string | null;
  managerPhone?: string | null;
  instantBooking?: boolean;
  dateRange?: DateRange;
  guestCount: number;
  onOpenDatePicker: () => void;
}

export function PropertyDetailMobileBar({
  propertyId,
  isSaleListing,
  salePrice,
  pricePerNight,
  ownershipLabel,
  titleEn,
  titleRu,
  managerPhone,
  instantBooking,
  dateRange,
  guestCount,
  onOpenDatePicker,
}: PropertyDetailMobileBarProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const handleReserve = () => {
    if (dateRange?.from && dateRange?.to) {
      const params = new URLSearchParams({
        checkIn: format(dateRange.from, 'yyyy-MM-dd'),
        checkOut: format(dateRange.to, 'yyyy-MM-dd'),
        guests: guestCount.toString(),
      });
      navigate(`${APP_ROUTES.PROPERTY_INQUIRY(propertyId)}?${params.toString()}`);
    } else {
      onOpenDatePicker();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border shadow-lg lg:hidden">
      <div className="max-w-[1536px] mx-auto flex items-center gap-3">
        {isSaleListing ? (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{isRu ? 'Цена' : 'Price'}</p>
              <span className="text-xl font-bold text-foreground">{formatPrice(salePrice)}</span>
              {ownershipLabel && (
                <p className="text-[11px] text-muted-foreground mt-0.5">{ownershipLabel}</p>
              )}
            </div>
            <MessageHostButton
              propertyId={propertyId}
              propertyTitle={titleEn ?? undefined}
              propertyTitleRu={titleRu ?? undefined}
              variant="default"
              className="flex-shrink-0"
              labelRu="Запросить консультацию"
              labelEn="Request consultation"
            />
          </>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground">
                  {formatPrice(pricePerNight)}
                </span>
                <span className="text-sm text-muted-foreground">
                  /{pluralizeNights(1, language)}
                </span>
              </div>
              {dateRange?.from && dateRange?.to && (
                <p className="text-xs text-muted-foreground">
                  {format(dateRange.from, 'd MMM', { locale: isRu ? ru : undefined })} –{' '}
                  {format(dateRange.to, 'd MMM', { locale: isRu ? ru : undefined })}
                </p>
              )}
              {!dateRange?.from && instantBooking && (
                <div className="flex items-center gap-1 text-xs text-primary mt-0.5">
                  <Zap className="w-3 h-3" />
                  <span>{isRu ? 'Мгновенное бронирование' : 'Instant booking'}</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="flex-shrink-0"
              onClick={() => {
                if (managerPhone) window.open(`tel:${managerPhone}`);
                else toast.info(isRu ? 'Телефон не указан' : 'Phone not available');
              }}
            >
              <Phone className="w-5 h-5" />
            </Button>
            <MessageHostButton
              propertyId={propertyId}
              propertyTitle={titleEn ?? undefined}
              propertyTitleRu={titleRu ?? undefined}
              variant="outline"
              size="icon"
              showLabel={false}
            />
            <Button
              size="lg"
              className={cn(
                'flex-shrink-0 px-6',
                instantBooking && !dateRange?.from && 'bg-accent-amber hover:bg-accent-amber/90',
              )}
              onClick={handleReserve}
            >
              {dateRange?.from && dateRange?.to ? (
                <>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {isRu ? 'Забронировать' : 'Reserve'}
                </>
              ) : instantBooking ? (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {isRu ? 'Забронировать' : 'Book Now'}
                </>
              ) : (
                <>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {isRu ? 'Выбрать даты' : 'Select Dates'}
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
