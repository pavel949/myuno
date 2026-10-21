import { useId, useState } from 'react';
import { format } from 'date-fns';
import { enUS, ru, th } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { bangkokTodayISO, civilDateKey, parseCivilDate } from '@/lib/hotelDates';
import { pickLang } from '@/lib/i18n/pickLang';

interface Props {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
}

/** Discovery filters only. Availability and inventory remain the catalogue's responsibility. */
export function HomeSearchDateRange({ checkIn, checkOut, onChange }: Props) {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const titleId = useId();
  const hintId = useId();
  const locale = language === 'ru' ? ru : language === 'th' ? th : enUS;
  const today = bangkokTodayISO();
  const title = pickLang(language, { ru: 'Даты проживания', en: 'Stay dates', th: 'วันที่เข้าพัก' });
  const hint = selectingEnd
    ? pickLang(language, { ru: 'Выберите дату выезда', en: 'Select check-out', th: 'เลือกวันเช็กเอาต์' })
    : pickLang(language, { ru: 'Выберите дату заезда', en: 'Select check-in', th: 'เลือกวันเช็กอิน' });
  const placeholder = pickLang(language, { ru: 'Выберите', en: 'Select', th: 'เลือก' });
  const display = (value: string) => value ? format(parseCivilDate(value), 'd MMM yyyy', { locale }) : placeholder;
  const changeOpen = (value: boolean) => {
    setOpen(value);
    if (value) setSelectingEnd(!!checkIn && !checkOut);
  };
  const trigger = (
    <button type="button" className="home-search-date-trigger" aria-label={title}>
      <span><span className="home-field-label">{pickLang(language, { ru: 'Заезд', en: 'Check-in', th: 'เช็กอิน' })}</span>{display(checkIn)}</span>
      <span><span className="home-field-label">{pickLang(language, { ru: 'Выезд', en: 'Check-out', th: 'เช็กเอาต์' })}</span>{display(checkOut)}</span>
      <CalendarDays size={18} aria-hidden="true" />
    </button>
  );
  const calendar = (
    <>
      <p id={hintId} className="px-3 pt-2 text-sm text-muted-foreground" aria-live="polite">{hint}</p>
      <Calendar
        mode="range"
        locale={locale}
        showOutsideDays={false}
        initialFocus
        defaultMonth={checkIn ? parseCivilDate(checkIn) : parseCivilDate(today)}
        selected={{ from: checkIn ? parseCivilDate(checkIn) : undefined, to: checkOut ? parseCivilDate(checkOut) : undefined }}
        numberOfMonths={1}
        fromDate={parseCivilDate(today)}
        disabled={date => civilDateKey(date) < today}
        onDayClick={(date, modifiers) => {
          if (modifiers.disabled) return;
          const value = civilDateKey(date);
          if (!selectingEnd || !checkIn || value <= checkIn) {
            onChange(value, '');
            setSelectingEnd(true);
          } else {
            onChange(checkIn, value);
            setOpen(false);
          }
        }}
        className="mx-auto w-fit px-0"
        classNames={{ head_cell: 'w-11 text-muted-foreground font-normal text-xs', cell: 'h-11 w-11 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent', day: 'h-11 w-11 p-0 font-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring touch-manipulation' }}
      />
      <div className="flex justify-between border-t p-3">
        <Button type="button" variant="ghost" onClick={() => { onChange('', ''); setSelectingEnd(false); }}>
          {pickLang(language, { ru: 'Сбросить даты', en: 'Clear dates', th: 'ล้างวันที่' })}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          {pickLang(language, { ru: 'Закрыть', en: 'Close', th: 'ปิด' })}
        </Button>
      </div>
    </>
  );
  return <div className="home-search-dates">
    {isMobile ? (
      <Sheet open={open} onOpenChange={changeOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto px-0 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <SheetTitle className="px-3 pr-8">{title}</SheetTitle>
          <SheetDescription className="sr-only">{hint}</SheetDescription>
          {calendar}
        </SheetContent>
      </Sheet>
    ) : (
      <Popover open={open} onOpenChange={changeOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent align="start" collisionPadding={12} className="z-[130] w-auto max-w-[calc(100vw-24px)] p-0" aria-labelledby={titleId} aria-describedby={hintId}>
          <h3 id={titleId} className="px-3 pt-3 font-medium">{title}</h3>
          {calendar}
        </PopoverContent>
      </Popover>
    )}
  </div>;
}
