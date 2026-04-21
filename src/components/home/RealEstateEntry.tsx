/**
 * RealEstateEntry — home-screen RE-first block.
 *
 * Three tracks: Rent · Buy · Investment.
 * Compact, mobile-first (384px). Each track shows: title, sub, average ticket,
 * commission line read from `useRevenueRates`.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRevenueRates } from '@/hooks/useRevenueRates';
import { RE_ENTRY_LABELS } from '@/lib/copy/govStyle';
import { APP_ROUTES } from '@/lib/config/routes';
import { Building2, Home, Landmark, ArrowRight } from 'lucide-react';

interface Track {
  id: 'rent' | 'buy' | 'invest';
  icon: React.ComponentType<{ className?: string }>;
  title: { ru: string; en: string };
  sub: { ru: string; en: string };
  feeLine: (rate: number) => { ru: string; en: string };
  ticketLine: { ru: string; en: string };
  rateId: string;
  href: string;
}

const TRACKS: Track[] = [
  {
    id: 'rent',
    icon: Home,
    title: RE_ENTRY_LABELS.trackRent,
    sub: RE_ENTRY_LABELS.trackRentSub,
    rateId: 'longterm_commission',
    feeLine: r => ({
      ru: `Комиссия: ${r}% от первого месяца (долгосрочная)`,
      en: `Fee: ${r}% of the first month (long-term)`,
    }),
    ticketLine: {
      ru: 'Средний контракт: ฿60 000 / мес',
      en: 'Average contract: THB 60 000 / mo',
    },
    href: `${APP_ROUTES.PROPERTY_BROWSE}?mode=rent`,
  },
  {
    id: 'buy',
    icon: Building2,
    title: RE_ENTRY_LABELS.trackBuy,
    sub: RE_ENTRY_LABELS.trackBuySub,
    rateId: 'resale_commission',
    feeLine: r => ({
      ru: `Комиссия: ${r}% (мин. ฿120 000), платит продавец`,
      en: `Fee: ${r}% (min THB 120 000), paid by seller`,
    }),
    ticketLine: {
      ru: 'Средняя сделка: ฿8 000 000',
      en: 'Average deal: THB 8 000 000',
    },
    href: APP_ROUTES.RESALE,
  },
  {
    id: 'invest',
    icon: Landmark,
    title: RE_ENTRY_LABELS.trackInvest,
    sub: RE_ENTRY_LABELS.trackInvestSub,
    rateId: 'investment_deal_fee',
    feeLine: r => ({
      ru: `Комиссия: ${r}% от сделки + 0,5% эскроу`,
      en: `Fee: ${r}% of deal + 0.5% escrow`,
    }),
    ticketLine: {
      ru: 'От 200 000 USD',
      en: 'From USD 200 000',
    },
    href: APP_ROUTES.CAPITAL_DEAL_INTAKE,
  },
];

export function RealEstateEntry() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { getRate } = useRevenueRates();

  return (
    <section className="px-4 pt-1 pb-6">
      <header className="mb-3">
        <h2 className="font-display text-[18px] leading-tight font-semibold text-foreground tracking-[-0.01em]">
          {isRu ? RE_ENTRY_LABELS.blockTitle.ru : RE_ENTRY_LABELS.blockTitle.en}
        </h2>
        <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug">
          {isRu ? RE_ENTRY_LABELS.blockSubtitle.ru : RE_ENTRY_LABELS.blockSubtitle.en}
        </p>
      </header>

      <ul className="space-y-2">
        {TRACKS.map(track => {
          const Icon = track.icon;
          const rate = getRate(track.rateId);
          const fee = track.feeLine(rate);
          return (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => navigate(track.href)}
                className="w-full text-left rounded-[14px] border border-border bg-card hover:border-border-strong hover:bg-card/80 transition-colors px-3.5 py-3 flex items-start gap-3 active:scale-[0.99]"
              >
                <span className="shrink-0 w-9 h-9 rounded-[10px] bg-muted text-foreground flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[14.5px] font-semibold text-foreground">
                      {isRu ? track.title.ru : track.title.en}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </span>
                  <span className="block text-[12.5px] text-muted-foreground mt-0.5 leading-snug">
                    {isRu ? track.sub.ru : track.sub.en}
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] font-mono text-foreground/80">
                    <span>{isRu ? fee.ru : fee.en}</span>
                    <span className="text-muted-foreground">·</span>
                    <span>{isRu ? track.ticketLine.ru : track.ticketLine.en}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
