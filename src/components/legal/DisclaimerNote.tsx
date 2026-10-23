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
  const body = language === 'ru'
    ? 'Расчёт зависит от введённых данных и допущений. Он не подтверждает фактическую доходность и не гарантирует будущие результаты.'
    : language === 'th'
      ? 'ผลคำนวณขึ้นอยู่กับข้อมูลและสมมติฐานที่ใช้ ไม่ใช่ผลตอบแทนที่เกิดขึ้นจริงและไม่รับประกันผลลัพธ์ในอนาคต'
      : 'Calculations depend on the supplied inputs and assumptions. They do not establish actual returns or guarantee future results.';

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'flex items-start gap-2 border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground',
          className,
        )}
        role="note"
      >
        <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
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
