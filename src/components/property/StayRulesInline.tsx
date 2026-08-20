/**
 * StayRulesInline — compact stay-rule chips for property cards.
 * Uses the same formatting source as StayRulesSection on the detail page,
 * so rentalTerms always read consistently across surfaces.
 */
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  buildStayRuleRows,
  toStayRuleLocale,
  type StayRuleId,
  type StayRuleSource,
} from '@/lib/property/stayRulesDisplay';

interface StayRulesInlineProps extends StayRuleSource {
  /** Limit the number of chips shown (cards are tight on space). */
  maxItems?: number;
  /** Only render these rules, in this order. */
  only?: StayRuleId[];
  className?: string;
}

export function StayRulesInline({
  maxItems,
  only,
  className,
  ...source
}: StayRulesInlineProps) {
  const { language } = useLanguage();
  const locale = toStayRuleLocale(language);
  let rows = buildStayRuleRows(source, locale);

  if (only?.length) {
    rows = only
      .map((id) => rows.find((row) => row.id === id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }
  if (maxItems && maxItems > 0) rows = rows.slice(0, maxItems);

  if (rows.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {rows.map((row) => (
        <span
          key={row.id}
          title={`${row.label}: ${row.value}`}
          className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-none bg-muted/80 text-muted-foreground max-w-full truncate"
        >
          {row.short}
        </span>
      ))}
    </div>
  );
}
