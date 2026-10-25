import { useId, useState, useLayoutEffect, useRef } from 'react';
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // The non-modal popover must accept a real outside click from its first paint,
  // including while Radix's entrance animation/dismissable layer is starting.
  useLayoutEffect(() => {
    if (!open || isMobile) return;
    const ownerDocument = triggerRef.current?.ownerDocument;
    if (!ownerDocument) return;
    let pointerStartedInside = false;
    const rememberPointerOrigin = (event: PointerEvent) => {
      const target = event.target as Node | null;
      pointerStartedInside = !!target && !!(triggerRef.current?.contains(target) || contentRef.current?.contains(target));
    };
    const cancelPointer = () => { pointerStartedInside = false; };
    const closeOutside = (event: MouseEvent) => {
      const startedInside = pointerStartedInside;
      pointerStartedInside = false;
      if (startedInside || event.button !== 0 || event.ctrlKey) return;
      // A foreign modal may own a sibling overlay rather than contain the click.
      // Native access-recheck curtains and Radix body locks take precedence over
      // this public, non-modal popover's local outside-click shortcut.
      if (ownerDocument.querySelector('dialog[open]') ||
          Number(ownerDocument.body.getAttribute('data-scroll-locked')) > 0 ||
          ownerDocument.body.style.pointerEvents === 'none') return;
      const target = event.target as Node | null;
      if (!target || triggerRef.current?.contains(target) || contentRef.current?.contains(target)) return;
      const element = target.nodeType === 1 ? target as Element : target.parentElement;
      if (element?.closest('[role="dialog"], [role="alertdialog"], dialog')) return;
      setOpen(false);
    };
    ownerDocument.addEventListener('pointerdown', rememberPointerOrigin, true);
    ownerDocument.addEventListener('pointercancel', cancelPointer, true);
    ownerDocument.addEventListener('click', closeOutside, true);
    return () => {
      pointerStartedInside = false;
      ownerDocument.removeEventListener('pointerdown', rememberPointerOrigin, true);
      ownerDocument.removeEventListener('pointercancel', cancelPointer, true);
      ownerDocument.removeEventListener('click', closeOutside, true);
    };
  }, [open, isMobile]);
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
    <button ref={triggerRef} type="button" className="home-search-date-trigger" aria-label={title}>
      <span><span className="home-field-label">{pickLang(language, { ru: 'Заезд', en: 'Check-in', th: 'เช็กอิน' })}</span>{display(checkIn)}</span>
      <span><span className="home-field-label">{pickLang(language, { ru: 'Выезд', en: 'Check-out', th: 'เช็กเอาต์' })}</span>{display(checkOut)}</span>
      <CalendarDays size={18} aria-hidden="true" />
    </button>
  );
  const calendar = (
    <>
      <div data-date-calendar-scroll className="min-h-0 overflow-y-auto overscroll-contain">
      <p id={hintId} className="px-3 pt-2 text-sm text-muted-foreground" aria-live="polite">{hint}</p>
      <Calendar
        mode="range"
        locale={locale}
        today={parseCivilDate(today)}
        showOutsideDays={false}
        autoFocus
        defaultMonth={checkIn ? parseCivilDate(checkIn) : parseCivilDate(today)}
        selected={{ from: checkIn ? parseCivilDate(checkIn) : undefined, to: checkOut ? parseCivilDate(checkOut) : undefined }}
        numberOfMonths={1}
        startMonth={parseCivilDate(today)}
        disabled={date => civilDateKey(date) < today}
        onSelect={(_range, date, modifiers) => {
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
        classNames={{ months: 'relative flex flex-col', nav: 'sticky top-0 z-20 -mb-11 flex h-11 items-center justify-between', month_caption: 'sticky top-0 z-10 flex h-11 items-center justify-center bg-popover', weekday: 'w-11 text-muted-foreground font-normal text-xs', day: 'h-11 w-11 text-center text-sm p-0 relative', day_button: 'h-11 w-11 p-0 font-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring touch-manipulation' }}
      />
      </div>
      <div className="flex shrink-0 justify-between border-t p-3">
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
        <SheetContent onOverlayClick={event => {
          if (event.button === 0 && !event.ctrlKey && event.target === event.currentTarget) setOpen(false);
        }} side="bottom" className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden px-0 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <SheetTitle className="shrink-0 px-3 pr-8">{title}</SheetTitle>
          <SheetDescription className="sr-only">{hint}</SheetDescription>
          {calendar}
        </SheetContent>
      </Sheet>
    ) : (
      <Popover open={open} onOpenChange={changeOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent ref={contentRef} align="start" collisionPadding={12} className="z-[130] flex w-auto flex-col gap-0 overflow-hidden p-0" style={{ maxWidth: 'calc(100vw - 2 * var(--layout-gutter))' }} aria-labelledby={titleId} aria-describedby={hintId}>
          <h3 id={titleId} className="shrink-0 px-3 pt-3 font-medium">{title}</h3>
          {calendar}
        </PopoverContent>
      </Popover>
    )}
  </div>;
}
