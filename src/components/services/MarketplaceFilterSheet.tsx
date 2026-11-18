import type { ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

/** Compact, shared entry to each catalogue's existing URL-backed controls. */
export function MarketplaceFilterSheet({ title, activeCount = 0, children, showLabel = false }: { title: string; activeCount?: number; children: ReactNode; showLabel?: boolean }) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  return <Sheet>
    <SheetTrigger asChild><Button type="button" variant="outline" size={showLabel ? 'default' : 'icon'} className={showLabel ? 'relative min-h-11 gap-2' : 'relative size-11 shrink-0'} aria-label={title}>
      <SlidersHorizontal className="size-4" aria-hidden="true" />{showLabel && <span>{title}</span>}
      {activeCount > 0 && <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center bg-primary text-xs text-primary-foreground">{activeCount}</span>}
    </Button></SheetTrigger>
    <SheetContent side="bottom" closeLabel={t('Закрыть', 'Close', 'ปิด')} className="max-h-[85dvh] space-y-5">
      <SheetHeader className="mx-auto w-full max-w-[var(--layout-width-article)]"><SheetTitle>{title}</SheetTitle><SheetDescription>{t('Условия сохраняются в ссылке', 'Your selections are saved in the link', 'ตัวเลือกของคุณจะถูกบันทึกในลิงก์')}</SheetDescription></SheetHeader>
      <div className="mx-auto w-full max-w-[var(--layout-width-article)] space-y-4">{children}
        <SheetClose asChild><Button className="min-h-11 w-full">{t('Показать предложения', 'Show offers', 'แสดงข้อเสนอ')}</Button></SheetClose>
      </div>
    </SheetContent>
  </Sheet>;
}
