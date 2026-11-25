import type { ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

interface MarketplaceFilterSheetProps {
  title: string;
  activeCount?: number;
  children: ReactNode;
  showLabel?: boolean;
  applyLabel?: string;
  onOpenChange?: (open: boolean) => void;
  onApply?: () => void;
  onReset?: () => void;
  applyDisabled?: boolean;
}

/** The body scrolls independently while the footer stays reachable, including on phones. */
export function MarketplaceFilterSheet({ title, activeCount = 0, children, showLabel = false, applyLabel, onOpenChange, onApply, onReset, applyDisabled }: MarketplaceFilterSheetProps) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  return <Sheet onOpenChange={onOpenChange}>
    <SheetTrigger asChild><Button type="button" variant="outline" size={showLabel ? 'default' : 'icon'} className={showLabel ? 'relative min-h-11 shrink-0 gap-2' : 'relative size-11 shrink-0'} aria-label={title}>
      <SlidersHorizontal className="size-4" aria-hidden="true" />{showLabel && <span>{title}</span>}
      {activeCount > 0 && <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center bg-primary text-xs text-primary-foreground">{activeCount}</span>}
    </Button></SheetTrigger>
    <SheetContent side="bottom" closeLabel={t('Закрыть', 'Close', 'ปิด')} className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(42rem,calc(100%_-_2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border">
      <SheetHeader className="shrink-0 border-b border-border px-4 pb-3 pt-4 pr-14 text-left sm:pl-6"><SheetTitle>{title}</SheetTitle><SheetDescription>{t('Условия сохраняются в ссылке после применения.', 'Apply to save your selections in the link.', 'ใช้ตัวกรองเพื่อบันทึกตัวเลือกในลิงก์')}</SheetDescription></SheetHeader>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">{children}</div>
      <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        {onReset && <Button type="button" variant="ghost" className="col-span-2 min-h-11 justify-self-start" onClick={onReset}>{t('Сбросить', 'Reset', 'ล้างค่า')}</Button>}
        <SheetClose asChild><Button type="button" variant="outline" className="min-h-11 whitespace-normal">{t('Отмена', 'Cancel', 'ยกเลิก')}</Button></SheetClose>
        <SheetClose asChild><Button type="button" className="min-h-11 whitespace-normal" disabled={applyDisabled} onClick={onApply}>{applyLabel ?? t('Показать предложения', 'Show offers', 'แสดงข้อเสนอ')}</Button></SheetClose>
      </div>
    </SheetContent>
  </Sheet>;
}
