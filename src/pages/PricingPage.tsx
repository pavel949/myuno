/**
 * PricingPage — RE-first pricing, 3 sections (buyers · developers · owners/MC).
 * Gov-tone: explicit numbers, no marketing wording.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRevenueRates } from '@/hooks/useRevenueRates';
import { TRUST_ITEMS, TRANSACTION_ITEMS, POST_TX_ITEMS, formatRevenueRate, formatWhoPays } from '@/lib/monetization/realEstateEngine';
import type { RevenueLineItem } from '@/lib/monetization/realEstateEngine';
import { APP_ROUTES } from '@/lib/config/routes';
import { LandingContainer } from '@/components/landings';
import { GlobalPreferencesControls } from '@/components/uno/GlobalPreferencesControls';
import { ArrowLeft } from 'lucide-react';

function Section({
  id,
  title,
  subtitle,
  items,
}: {
  id: string;
  title: { ru: string; en: string };
  subtitle: { ru: string; en: string };
  items: RevenueLineItem[];
}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  return (
    <section id={id} className="py-5 border-t border-border first:border-t-0">
      <h2 className="font-display text-[18px] font-semibold text-foreground tracking-[-0.01em]">
        {isRu ? title.ru : title.en}
      </h2>
      <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug">
        {isRu ? subtitle.ru : subtitle.en}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map(item => (
          <li
            key={item.id}
            className="rounded-none border border-border bg-card px-3.5 py-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-foreground leading-tight">
                  {isRu ? item.label.ru : item.label.en}
                </div>
                <div className="text-[11.5px] text-muted-foreground mt-0.5">
                  {isRu ? 'Платит' : 'Paid by'}: {formatWhoPays(item.whoPays, isRu)}
                  {item.minFee !== undefined && (
                    <>
                      {' · '}
                      {isRu ? 'мин.' : 'min'} {item.minFee.toLocaleString('ru-RU')}
                      {' '}{item.currency === 'USD' ? 'USD' : '฿'}
                    </>
                  )}
                </div>
                {item.note && (
                  <div className="text-[11.5px] text-muted-foreground mt-1 leading-snug">
                    {isRu ? item.note.ru : item.note.en}
                  </div>
                )}
              </div>
              <div className="text-[14px] font-mono font-semibold text-foreground shrink-0">
                {formatRevenueRate(item)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function PricingPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { withResolvedRate } = useRevenueRates();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 border-b border-border">
        <LandingContainer className="flex items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link to={APP_ROUTES.HOME} aria-label={isRu ? 'Назад' : 'Back'}>
              <ArrowLeft className="h-5 w-5 shrink-0 text-foreground" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate font-display text-[16px] font-semibold text-foreground">
                {isRu ? 'Тарифы и комиссии' : 'Pricing and fees'}
              </h1>
              <p className="text-[11.5px] text-muted-foreground">
                {isRu ? 'Оператор: myUNO Pte. Ltd.' : 'Operator: myUNO Pte. Ltd.'}
              </p>
            </div>
          </div>
          <GlobalPreferencesControls size="sm" themeVariant="dropdown" className="shrink-0" />
        </LandingContainer>
      </header>

      <LandingContainer className="pb-16">
      <Section
        id="trust"
        title={{ ru: 'Покупателям и инвесторам', en: 'For buyers and investors' }}
        subtitle={{
          ru: 'Платная верификация: проект, цена, юридический статус, контрагент.',
          en: 'Paid verification: project, price, legal status, counterparty.',
        }}
        items={TRUST_ITEMS.map(withResolvedRate)}
      />

      <Section
        id="transaction"
        title={{ ru: 'Сделки', en: 'Transactions' }}
        subtitle={{
          ru: 'Комиссии при продаже, покупке и аренде недвижимости.',
          en: 'Commissions on sale, purchase and rental.',
        }}
        items={TRANSACTION_ITEMS.map(withResolvedRate)}
      />

      <Section
        id="post"
        title={{ ru: 'Владельцам и управляющим компаниям', en: 'For owners and management companies' }}
        subtitle={{
          ru: 'Подписки и услуги после сделки.',
          en: 'Subscriptions and services after the deal.',
        }}
        items={POST_TX_ITEMS.map(withResolvedRate)}
      />
      </LandingContainer>
    </div>
  );
}
