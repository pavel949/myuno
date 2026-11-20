import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Shapes, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

export interface MarketplaceCategoryItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  image?: string;
  href?: string;
  navigationState?: unknown;
}

type MenuProps = {
  title: string;
  testId?: string;
  allLabel?: string;
  headingId?: string;
  itemAttribute?: 'data-category-id' | 'data-situation-code';
} & (
  | {items: MarketplaceCategoryItem[]; onSelect: (id: string) => void}
  | {items: (MarketplaceCategoryItem & {href: string})[]; onSelect?: never}
);

/** Shared navigation over existing catalogue records, never an offering or availability source. */
export function MarketplaceDiscoveryMenu({ title, items, onSelect, testId, headingId, itemAttribute = 'data-category-id', allLabel }: MenuProps) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  const choose = (id: string) => { setOpen(false); onSelect?.(id); };
  const cards = (rows: MarketplaceCategoryItem[]) => rows.map(item => {
    const Icon = item.icon ?? Shapes;
    const content = <>
      {item.image ? <img src={item.image} alt="" className="size-12 shrink-0 object-cover max-[399px]:size-9 sm:size-14" loading="lazy" />
        : <span className="flex size-12 shrink-0 items-center justify-center bg-muted max-[399px]:size-9 sm:size-14"><Icon className="size-5 text-primary" aria-hidden="true" /></span>}
      <span className="min-w-0 flex-1 break-words text-sm font-medium leading-snug max-[399px]:col-span-2 max-[399px]:row-start-2">{item.label}</span>
      {item.href && <ArrowUpRight className="size-4 shrink-0 text-muted-foreground max-[399px]:col-start-2 max-[399px]:row-start-1 max-[399px]:justify-self-end" aria-hidden="true" />}
    </>;
    const className = 'flex min-h-20 min-w-0 items-center gap-2 border border-border bg-card p-2 text-left text-foreground transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-[399px]:grid max-[399px]:grid-cols-[minmax(0,1fr)_auto] max-[399px]:content-start sm:gap-3 sm:p-3';
    return item.href ? <Link key={item.id} to={item.href} state={item.navigationState} aria-label={item.label} className={className} onClick={() => setOpen(false)}>{content}</Link>
      : <button key={item.id} type="button" {...{ [itemAttribute]: item.id }} aria-label={item.label} className={className} onClick={() => choose(item.id)}>{content}</button>;
  });
  return <section aria-label={title} data-testid={testId} className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <h2 tabIndex={-1} id={headingId} className="font-display text-lg font-medium">{title}</h2>
      {items.length > 6 && <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild><Button variant="ghost" size="sm" className="min-h-11 shrink-0 px-2">{allLabel || t('Все категории', 'All categories', 'ทุกหมวดหมู่')}</Button></SheetTrigger>
        <SheetContent side="bottom" closeLabel={t('Закрыть', 'Close', 'ปิด')} className="max-h-[85dvh] space-y-4">
          <SheetHeader><SheetTitle>{title}</SheetTitle><SheetDescription>{t('Выберите подходящий вариант', 'Choose an option', 'เลือกตัวเลือกที่ต้องการ')}</SheetDescription></SheetHeader>
          <div className="grid grid-cols-2 gap-2 pb-[env(safe-area-inset-bottom)] sm:grid-cols-3 lg:grid-cols-4">{cards(items)}</div>
        </SheetContent>
      </Sheet>}
    </div>
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">{cards(items.slice(0, 6))}</div>
  </section>;
}
