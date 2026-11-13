/**
 * PropertyDetailMobileBar — Fixed bottom CTA for the property detail page on mobile.
 * Shows price + "Reserve / Select dates / Book now" or "Request consultation" for sale listings.
 */
import { useLayoutEffect, useRef } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { MessageHostButton } from '@/components/property';
import { PropertyQuestionButton } from '@/components/property/PropertyQuestionButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { pickLang } from '@/lib/i18n/pickLang';

interface PropertyDetailMobileBarProps {
  propertyId: string;
  isSaleListing: boolean;
  isLongStayOnly?: boolean;
  salePrice: number | null;
  pricePerNight?: number | null;
  rentalPriceLabel?: string;
  guestSearch?: string;
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
  isLongStayOnly = false,
  salePrice,
  pricePerNight,
  rentalPriceLabel,
  guestSearch,
  ownershipLabel,
  titleEn,
  titleRu,
  managerPhone,
  instantBooking,
  dateRange,
  guestCount,
  onOpenDatePicker,
}: PropertyDetailMobileBarProps) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const actionBarRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const bar = actionBarRef.current;
    if (!bar) return;
    const root = document.documentElement;
    const variable = '--property-detail-action-clearance';
    const previous = root.style.getPropertyValue(variable);
    const priority = root.style.getPropertyPriority(variable);
    let active = true;
    const measure = () => {
      if (!active) return;
      const rect = bar.getBoundingClientRect();
      // Includes the existing bottom-nav/safe-area offset, not just bar height.
      const clearance = rect.height > 0 ? Math.max(0, Math.ceil(window.innerHeight - rect.top)) : 0;
      root.style.setProperty(variable, `${clearance}px`);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(bar);
    window.addEventListener('resize', measure);
    return () => {
      active = false;
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      if (previous) root.style.setProperty(variable, previous, priority);
      else root.style.removeProperty(variable);
    };
  }, []);

  // Always review the shared calculator and availability before inquiry navigation.
  const handleReserve = () => onOpenDatePicker();

  return (
    <div ref={actionBarRef} data-property-detail-action-bar className="fixed bottom-[var(--bottom-nav-h)] left-0 right-0 z-40 p-4 bg-background/95 border-t border-border shadow-lg lg:hidden">
      <div className="max-w-[1536px] mx-auto flex flex-wrap items-center gap-3">
        {isSaleListing || isLongStayOnly ? (
          <>
            <div className="flex-1 min-w-0">
              {isSaleListing ? <>
                <p className="text-xs text-muted-foreground">{isRu ? 'Цена' : 'Price'}</p>
                <span className="text-xl font-bold text-foreground">{typeof salePrice === 'number' && salePrice > 0 ? formatPrice(salePrice) : (isRu ? 'Цена по запросу' : 'Price on request')}</span>
              </> : <p className="text-sm font-semibold text-foreground">{rentalPriceLabel ?? pickLang(language, { ru: 'Условия аренды', en: 'Rental terms', th: 'เงื่อนไขการเช่า' })}</p>}
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
              labelRu={isSaleListing ? 'Запросить консультацию' : 'Запросить аренду'}
              labelEn={isSaleListing ? 'Request consultation' : pickLang(language, { en: 'Request rental', ru: 'Запросить аренду', th: 'สอบถามการเช่า' })}
            />
          </>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              {dateRange?.from && dateRange?.to ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {format(dateRange.from, 'd MMM', { locale: isRu ? ru : undefined })} –{' '}
                    {format(dateRange.to, 'd MMM', { locale: isRu ? ru : undefined })}
                  </p>
                  <button
                    onClick={onOpenDatePicker}
                    className="text-sm font-medium text-foreground underline decoration-dotted underline-offset-2"
                  >
                    {isRu ? 'Изменить даты' : 'Change dates'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    {isRu ? 'Добавьте даты' : 'Add dates'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {isRu ? 'Чтобы увидеть итоговую цену' : 'To see the total price'}
                  </p>
                </>
              )}
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 w-full">
            <PropertyQuestionButton propertyId={propertyId} title={isRu ? titleRu || titleEn : titleEn || titleRu} context={{ dateRange, guests: guestCount }} className="h-auto min-h-11 py-2 text-xs whitespace-normal" />
            <Button
              size="lg"
              className="h-auto min-h-11 px-3 py-2 text-xs whitespace-normal"
              onClick={handleReserve}
            >
              <CalendarIcon className="w-4 h-4 shrink-0" />
              {dateRange?.from && dateRange?.to ? (isRu ? 'Расчёт и заявка' : 'Cost & booking request') : (isRu ? 'Рассчитать стоимость' : 'Calculate stay cost')}
            </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
