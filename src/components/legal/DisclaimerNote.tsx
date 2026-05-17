import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Standardised disclaimer used near yield / ROI / capital-related public
 * blocks. See docs/business/regulatory-language.md §5.
 *
 * variant="inline" — small text, no border (good inside CTAs / cards).
 * variant="card"   — bordered note, more prominent (good above ROI tables).
 */
export type DisclaimerNoteVariant = 'inline' | 'card';

interface DisclaimerNoteProps {
  variant?: DisclaimerNoteVariant;
  className?: string;
}

export function DisclaimerNote({ variant = 'inline', className }: DisclaimerNoteProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const body = isRu
    ? 'Только историческая статистика и сопоставимые объекты. Это не финансовый совет и не обещание будущих результатов. myUNO — площадка по недвижимости, а не инвестиционный консультант.'
    : 'Historical and comparable data only. Not financial advice and not a guarantee of future performance. myUNO is a real-estate marketplace, not an investment adviser.';

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'flex items-start gap-2 border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground',
          className,
        )}
        role="note"
      >
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>{body}</p>
      </div>
    );
  }

  return (
    <p
      className={cn('text-[11px] leading-relaxed text-muted-foreground', className)}
      role="note"
    >
      {body}
    </p>
  );
}

export default DisclaimerNote;
