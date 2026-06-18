/**
 * ConciergeHelpCTA — встраиваемые CTA-блоки «Помощь myUNO».
 *
 * 3 варианта рендера:
 *  - `card`   — крупный блок-карточка (для нижней части страницы)
 *  - `inline` — компактная плашка (для встраивания в hero/секции)
 *  - `fab`    — плавающая кнопка снизу-справа (для длинных страниц)
 *
 * При клике открывает <ConciergeHelpSheet> с заданным topic.
 */
import { useState } from 'react';
import { MessageCircleQuestion, LifeBuoy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { ConciergeHelpSheet, type HelpTopic } from './ConciergeHelpSheet';
import { trackEvent } from '@/lib/analytics/track';

export interface ConciergeHelpCTAProps {
  topic: HelpTopic;
  variant?: 'card' | 'inline' | 'fab';
  /** Optional custom title/description override. */
  title?: string;
  description?: string;
  className?: string;
  /** Context passed to the form. */
  vendorId?: string | null;
  listingId?: string | null;
  initialSubject?: string;
  sourceData?: Record<string, unknown>;
}

const TOPIC_COPY: Record<HelpTopic, { ru: { t: string; d: string }; en: { t: string; d: string } }> = {
  visa: {
    ru: { t: 'Нужна помощь с визой?', d: 'Эксперт myUNO ответит и подберёт подходящий вариант — без хождения по агентствам.' },
    en: { t: 'Need help with a visa?', d: 'A myUNO expert will answer and match the right option — no agency-hopping.' },
  },
  invest: {
    ru: { t: 'Помощь с инвестицией', d: 'Аналитик myUNO бесплатно проведёт по объектам, рискам и доходности.' },
    en: { t: 'Help with your investment', d: 'A myUNO analyst will walk you through objects, risks and yields — free.' },
  },
  business: {
    ru: { t: 'Помощь с компанией и бизнесом', d: 'Регистрация, налоги, юрист, бухгалтер — обсудим вашу задачу под NDA.' },
    en: { t: 'Help with company & business', d: 'Setup, taxes, lawyer, accountant — discuss your case under NDA.' },
  },
  relocation: {
    ru: { t: 'Помощь с переездом', d: 'Подберём перевозчика, упаковщика, хранение — координатор myUNO ведёт от старта до распаковки.' },
    en: { t: 'Help with relocation', d: 'Movers, packers, storage — a myUNO coordinator runs the whole move for you.' },
  },
  property: {
    ru: { t: 'Помощь по объекту', d: 'Менеджер myUNO ответит на вопросы и организует просмотр или встречу с застройщиком.' },
    en: { t: 'Help with this property', d: 'A myUNO manager will answer and arrange a viewing or developer meeting.' },
  },
  legal: {
    ru: { t: 'Юридический вопрос', d: 'Запишем суть и подключим профильного юриста myUNO.' },
    en: { t: 'Legal question', d: "We'll capture the case and bring in the right myUNO lawyer." },
  },
  finance: {
    ru: { t: 'Вопрос по финансам', d: 'Переводы, обмен, налоги — менеджер myUNO разберёт ваш кейс.' },
    en: { t: 'Finance question', d: 'Transfers, FX, taxes — a myUNO manager will work through your case.' },
  },
  general: {
    ru: { t: 'Связаться с myUNO', d: 'Не нашли нужное? Опишите задачу — мы поможем разобраться.' },
    en: { t: 'Contact myUNO', d: "Didn't find what you need? Describe the task — we'll figure it out." },
  },
};

export function ConciergeHelpCTA(props: ConciergeHelpCTAProps) {
  const {
    topic,
    variant = 'card',
    title,
    description,
    className,
    vendorId,
    listingId,
    initialSubject,
    sourceData,
  } = props;
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [open, setOpen] = useState(false);

  const copy = TOPIC_COPY[topic][isRu ? 'ru' : 'en'];
  const finalTitle = title ?? copy.t;
  const finalDescription = description ?? copy.d;
  const ctaLabel = isRu ? 'Запросить помощь myUNO' : 'Request myUNO help';

  const handleOpen = () => {
    trackEvent('help_request_open', { topic, variant });
    setOpen(true);
  };

  const sheet = (
    <ConciergeHelpSheet
      open={open}
      onOpenChange={setOpen}
      topic={topic}
      initialSubject={initialSubject}
      vendorId={vendorId}
      listingId={listingId}
      sourceData={sourceData}
    />
  );

  if (variant === 'fab') {
    return (
      <>
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            'fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg px-4 py-3 text-sm font-medium hover:opacity-95 active:scale-95 transition',
            'md:bottom-6 md:right-6',
            className,
          )}
          aria-label={ctaLabel}
        >
          <LifeBuoy className="w-4 h-4" />
          <span className="hidden sm:inline">{isRu ? 'Помощь myUNO' : 'myUNO help'}</span>
        </button>
        {sheet}
      </>
    );
  }

  if (variant === 'inline') {
    return (
      <>
        <div
          className={cn(
            'flex items-center justify-between gap-3 rounded-md border bg-card px-4 py-3 text-sm',
            className,
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <MessageCircleQuestion className="w-5 h-5 shrink-0 text-primary" />
            <span className="truncate">{finalTitle}</span>
          </div>
          <Button size="sm" variant="default" onClick={handleOpen} className="shrink-0">
            {isRu ? 'Запросить' : 'Request'}
          </Button>
        </div>
        {sheet}
      </>
    );
  }

  // card (default)
  return (
    <>
      <Card className={cn('p-5 sm:p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20', className)}>
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex w-12 h-12 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg leading-tight">{finalTitle}</h3>
            <p className="text-sm text-muted-foreground mt-1.5">{finalDescription}</p>
            <Button onClick={handleOpen} className="mt-4">
              {ctaLabel}
            </Button>
          </div>
        </div>
      </Card>
      {sheet}
    </>
  );
}
