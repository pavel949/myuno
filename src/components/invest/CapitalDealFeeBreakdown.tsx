/**
 * CapitalDealFeeBreakdown — explicit fee breakdown for an investment deal.
 *
 * Reads rates from `useRevenueRates` so any change in `system_settings`
 * propagates without code changes. Shows: deal fee, escrow fee, optional
 * ROI report fee, optional WorldCheck KYC fee, plus a computed total at
 * a sample deal size (default USD 300 000).
 *
 * Tone: gov-tech. No marketing.
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRevenueRates } from '@/hooks/useRevenueRates';
import { MONETIZATION_LABELS } from '@/lib/copy/govStyle';
import { Calculator } from 'lucide-react';

interface Props {
  /** Sample deal size for the worked example, in USD. Default 300 000. */
  sampleDealUsd?: number;
  className?: string;
}

function fmtUsd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}
function fmtThb(n: number): string {
  return `฿${Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ')}`;
}

export function CapitalDealFeeBreakdown({ sampleDealUsd = 300000, className }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { getRate } = useRevenueRates();

  const dealFeePct = getRate('investment_deal_fee'); // %
  const escrowPct = getRate('escrow_fee'); // %
  const roiThb = getRate('trust_roi'); // fixed THB
  const wcThb = getRate('trust_worldcheck'); // fixed THB

  const dealFeeUsd = sampleDealUsd * (dealFeePct / 100);
  const escrowUsd = sampleDealUsd * (escrowPct / 100);

  const rows: { id: string; label: { ru: string; en: string }; value: string; mandatory: boolean }[] = [
    {
      id: 'deal',
      label: {
        ru: `Комиссия сделки — ${dealFeePct}% от суммы (платит покупатель)`,
        en: `Deal fee — ${dealFeePct}% of deal value (paid by buyer)`,
      },
      value: fmtUsd(dealFeeUsd),
      mandatory: true,
    },
    {
      id: 'escrow',
      label: {
        ru: `Эскроу-сопровождение — ${escrowPct}% от суммы`,
        en: `Escrow handling — ${escrowPct}% of deal value`,
      },
      value: fmtUsd(escrowUsd),
      mandatory: true,
    },
    {
      id: 'wc',
      label: {
        ru: 'WorldCheck KYC / AML (обязательно для сделок от 200 000 USD)',
        en: 'WorldCheck KYC / AML (required for deals from USD 200 000)',
      },
      value: fmtThb(wcThb),
      mandatory: true,
    },
    {
      id: 'roi',
      label: {
        ru: 'ROI-отчёт по объекту — по запросу',
        en: 'Investment ROI report — on request',
      },
      value: fmtThb(roiThb),
      mandatory: false,
    },
  ];

  return (
    <section
      className={`rounded-[14px] border border-border bg-card px-3.5 py-3 ${className ?? ''}`}
      aria-label={isRu ? MONETIZATION_LABELS.feeBlock.ru : MONETIZATION_LABELS.feeBlock.en}
    >
      <header className="mb-2.5 flex items-center gap-2">
        <Calculator className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-[13.5px] font-semibold text-foreground">
          {isRu ? MONETIZATION_LABELS.feeBlock.ru : MONETIZATION_LABELS.feeBlock.en}
        </h3>
      </header>

      <p className="text-[11.5px] text-muted-foreground mb-2 leading-snug">
        {isRu
          ? `Расчёт показан для сделки ${fmtUsd(sampleDealUsd)}. Все ставки — публичные.`
          : `Worked example: deal of ${fmtUsd(sampleDealUsd)}. All rates are public.`}
      </p>

      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li key={row.id} className="py-2 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] text-foreground leading-snug">
                {isRu ? row.label.ru : row.label.en}
              </div>
              {!row.mandatory && (
                <div className="text-[10.5px] text-muted-foreground mt-0.5">
                  {isRu ? 'Опционально' : 'Optional'}
                </div>
              )}
            </div>
            <div className="text-[12.5px] font-mono text-foreground/90 shrink-0 tabular-nums">
              {row.value}
            </div>
          </li>
        ))}
      </ul>

      <footer className="mt-2 pt-2 border-t border-border">
        <p className="text-[11px] text-muted-foreground leading-snug">
          {isRu
            ? `${MONETIZATION_LABELS.serviceOperator.ru}: myUNO Pte. Ltd. Все суммы фиксируются в реестре операций (аудит-маркер на странице платежа).`
            : `${MONETIZATION_LABELS.serviceOperator.en}: myUNO Pte. Ltd. All amounts are recorded in the ledger (audit marker shown on the payment screen).`}
        </p>
      </footer>
    </section>
  );
}
