import '@/styles/marketplace-unity.css';
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
  description?: string;
  icon?: LucideIcon;
  image?: string;
  href?: string;
  navigationState?: unknown;
}

type MenuProps = {
  title: string;
  testId?: string;
  allLabel?: string;
  allHref?: string;
  headingId?: string;
  itemAttribute?: 'data-category-id' | 'data-situation-code';
} & (
  | {items: MarketplaceCategoryItem[]; onSelect: (id: string) => void}
  | {items: (MarketplaceCategoryItem & {href: string})[]; onSelect?: never}
);

/** Shared navigation over existing catalogue records, never an offering or availability source. */
export function MarketplaceDiscoveryMenu({ title, items, onSelect, testId, headingId, itemAttribute = 'data-category-id', allLabel, allHref }: MenuProps) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  const choose = (id: string) => { setOpen(false); onSelect?.(id); };
  const cards = (rows: MarketplaceCategoryItem[]) => rows.map(item => {
    const Icon = item.icon ?? Shapes;
    const content = <>
      <span className="marketplace-choice-art">{item.image ? <img src={item.image} alt="" loading="lazy" />
        : <Icon aria-hidden="true" />}</span>
      <span className="marketplace-choice-copy"><span className="marketplace-choice-label">{item.label}</span>
        {item.description && <span className="marketplace-choice-description">{item.description}</span>}</span>
      <ArrowUpRight className="marketplace-choice-arrow" aria-hidden="true" />
    </>;
    const className = 'marketplace-choice';
    return item.href ? <Link key={item.id} to={item.href} state={item.navigationState} aria-label={item.label} className={className} onClick={() => setOpen(false)}>{content}</Link>
      : <button key={item.id} type="button" {...{ [itemAttribute]: item.id }} aria-label={item.label} className={className} onClick={() => choose(item.id)}>{content}</button>;
  });
  return <section aria-label={title} data-testid={testId} className="marketplace-menu">
    <div className="marketplace-section-heading">
      <h2 tabIndex={-1} id={headingId} className="marketplace-section-title">{title}</h2>
      {allHref && <Link to={allHref} className="marketplace-section-action">{allLabel || t('Все категории', 'All categories', 'ทุกหมวดหมู่')}</Link>}
      {items.length > 6 && <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild><Button variant="ghost" size="sm" className="min-h-11 shrink-0 px-2">{allLabel || t('Все категории', 'All categories', 'ทุกหมวดหมู่')}</Button></SheetTrigger>
        <SheetContent side="bottom" closeLabel={t('Закрыть', 'Close', 'ปิด')} className="max-h-[85dvh] space-y-4">
          <SheetHeader><SheetTitle>{title}</SheetTitle><SheetDescription>{t('Выберите подходящий вариант', 'Choose an option', 'เลือกตัวเลือกที่ต้องการ')}</SheetDescription></SheetHeader>
          <div className="grid grid-cols-2 gap-2 pb-[env(safe-area-inset-bottom)] sm:grid-cols-3 lg:grid-cols-4">{cards(items)}</div>
        </SheetContent>
      </Sheet>}
    </div>
    <div className="marketplace-choice-grid">{cards(items.slice(0, 6))}</div>
  </section>;
}
