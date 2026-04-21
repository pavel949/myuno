/**
 * CapitalDealIntake — `/invest/capital-deal` page.
 *
 * Investment-deal intake flow for transactions from USD 200 000:
 *  1. Plain-language explainer of what the platform does in this flow.
 *  2. Explicit fee breakdown (CapitalDealFeeBreakdown).
 *  3. Audit-marker preview (rule §13.6 — money-screen visibility).
 *  4. Moscow ombudsman passive notice (escalation channel).
 *  5. CapitalIntroForm wired with `request_type='investment_deal'`.
 *
 * No new top-level routes. Lives under `/invest/*`.
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp';
import { CapitalIntroForm } from '@/components/invest/CapitalIntroForm';
import { CapitalDealFeeBreakdown } from '@/components/invest/CapitalDealFeeBreakdown';
import { MoscowOmbudsmanNotice } from '@/components/invest/MoscowOmbudsmanNotice';
import { AuditMarker } from '@/components/monetization/AuditMarker';
import { Landmark, ShieldCheck, FileSearch, Banknote } from 'lucide-react';

const STEPS: { icon: React.ComponentType<{ className?: string }>; ru: string; en: string }[] = [
  {
    icon: FileSearch,
    ru: 'Подбор объекта и независимая оценка цены (Fair-Price, ฿9 900) либо ROI-отчёт (฿14 900).',
    en: 'Asset shortlist and independent fair-price assessment (THB 9 900) or ROI report (THB 14 900).',
  },
  {
    icon: ShieldCheck,
    ru: 'WorldCheck KYC / AML по сторонам сделки (฿4 900). Юридический Due Diligence — ฿35 000 при необходимости.',
    en: 'WorldCheck KYC / AML on counterparties (THB 4 900). Legal due diligence (THB 35 000) on request.',
  },
  {
    icon: Banknote,
    ru: 'Эскроу-сопровождение и подписание договора. Платёж проходит через защищённый счёт.',
    en: 'Escrow handling and contract signing. Payment routes through a protected account.',
  },
];

export default function CapitalDealIntake() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <MiniAppLayout
      title={isRu ? 'Инвестиционная сделка от 200 000 USD' : 'Investment deal from USD 200 000'}
      subtitle={
        isRu
          ? 'Сопровождение сделки: проверка, эскроу, подписание.'
          : 'Deal support: verification, escrow, signing.'
      }
      showSearch={false}
    >
      <div className="space-y-5 pb-12 max-w-2xl">
        {/* Hero / scope */}
        <section className="rounded-[14px] border border-border bg-card px-3.5 py-3.5">
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-10 h-10 rounded-[10px] bg-muted text-foreground flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-foreground leading-snug">
                {isRu
                  ? 'Услуга применяется к сделкам в недвижимости и бизнесе с суммой от 200 000 USD'
                  : 'Service applies to real-estate and business deals from USD 200 000'}
              </h2>
              <p className="text-[12.5px] text-muted-foreground mt-1 leading-snug">
                {isRu
                  ? 'Оператор сделки — myUNO Pte. Ltd. Все ставки и сроки публичны и зафиксированы в реестре настроек платформы.'
                  : 'Service operator — myUNO Pte. Ltd. All rates and timeframes are public and stored in the platform settings registry.'}
              </p>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section>
          <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wide mb-2">
            {isRu ? 'Состав услуги' : 'Service scope'}
          </h3>
          <ol className="space-y-2">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <li
                  key={idx}
                  className="rounded-[12px] border border-border bg-card px-3 py-2.5 flex items-start gap-3"
                >
                  <span className="shrink-0 w-7 h-7 rounded-full bg-muted text-foreground/80 flex items-center justify-center text-[11.5px] font-mono">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[12.5px] text-foreground leading-snug">
                        {isRu ? step.ru : step.en}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Fee breakdown */}
        <CapitalDealFeeBreakdown sampleDealUsd={300000} />

        {/* Moscow ombudsman */}
        <MoscowOmbudsmanNotice />

        {/* Audit marker preview */}
        <section>
          <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wide mb-2">
            {isRu ? 'Аудит сделки' : 'Deal audit'}
          </h3>
          <p className="text-[12px] text-muted-foreground mb-2 leading-snug">
            {isRu
              ? 'После оплаты на странице платежа отображается аудит-маркер: идентификатор операции, запись в реестре и время. Пример формата:'
              : 'After payment, the payment screen shows an audit marker: transaction id, ledger entry, timestamp. Example format:'}
          </p>
          <AuditMarker
            txId="tx_preview_AAA111"
            ledgerEntryId="le_preview_BBB222"
            timestamp={new Date()}
            stream="R1_transaction"
          />
        </section>

        {/* Intake form */}
        <section>
          <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wide mb-2">
            {isRu ? 'Заявка на сопровождение' : 'Request deal support'}
          </h3>
          <div className="rounded-[14px] border border-border bg-card px-3.5 py-4">
            <CapitalIntroForm
              defaults={{
                request_type: 'capital_advisory',
                asset_class: 'real_estate',
              }}
              showCapitalRange
              showTimeline
            />
          </div>
        </section>
      </div>
    </MiniAppLayout>
  );
}
