/**
 * MonetizationDisclosure — gov-tone fee disclosure block.
 *
 * Use anywhere a transaction (or transaction-eligible listing) is shown to the user.
 * No marketing wording. Numbers are explicit and read from `useRevenueRates`.
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRevenueRates } from '@/hooks/useRevenueRates';
import { getRereItem, formatRevenueRate, formatWhoPays } from '@/lib/monetization/realEstateEngine';
import { MONETIZATION_LABELS } from '@/lib/copy/govStyle';
import { Info } from 'lucide-react';

interface Props {
  /** id from `RERE_ALL_ITEMS` (e.g. `resale_commission`, `str_guest_fee`). */
  itemId: string;
  /** Optional caller-supplied note appended below the standard line. */
  extraNote?: { ru: string; en: string };
  className?: string;
}

export function MonetizationDisclosure({ itemId, extraNote, className }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { withResolvedRate } = useRevenueRates();

  const base = getRereItem(itemId);
  if (!base) return null;
  const item = withResolvedRate(base);

  const label = isRu ? item.label.ru : item.label.en;
  const rateText = formatRevenueRate(item);
  const whoText = formatWhoPays(item.whoPays, isRu);
  const minFeeText =
    item.minFee !== undefined
      ? isRu
        ? `Минимум: ${item.minFee.toLocaleString('ru-RU')} ${item.currency === 'USD' ? 'USD' : '฿'}`
        : `Minimum: ${item.currency === 'USD' ? '$' : '฿'}${item.minFee.toLocaleString('en-US')}`
      : null;

  return (
    <div
      className={`rounded-none border border-border bg-muted/30 px-3 py-2.5 text-[12.5px] leading-snug ${className ?? ''}`}
      role="note"
    >
      <div className="flex items-start gap-2">
        <Info className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
        <div className="min-w-0 space-y-1">
          <div className="text-foreground">
            <span className="font-medium">{label}</span>
            {' — '}
            <span className="font-mono">{rateText}</span>
            {'. '}
            <span className="text-muted-foreground">
              {isRu ? `${MONETIZATION_LABELS.whoPays.ru.toLowerCase()}: ${whoText}` : `${MONETIZATION_LABELS.whoPays.en.toLowerCase()}: ${whoText}`}.
            </span>
          </div>
          {minFeeText && <div className="text-muted-foreground">{minFeeText}</div>}
          {item.note && (
            <div className="text-muted-foreground">{isRu ? item.note.ru : item.note.en}</div>
          )}
          {extraNote && (
            <div className="text-muted-foreground">{isRu ? extraNote.ru : extraNote.en}</div>
          )}
        </div>
      </div>
    </div>
  );
}
