/**
 * TrustAsAService — 4 paid verification services.
 *
 * Mirrors `TRUST_ITEMS` from realEstateEngine. Each card: name, price, turnaround.
 * Click → /property/clearview (for ClearView) or /pricing#trust for the rest.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRevenueRates } from '@/hooks/useRevenueRates';
import { TRUST_ITEMS, formatRevenueRate } from '@/lib/monetization/realEstateEngine';
import { RE_TRUST_LABELS } from '@/lib/copy/govStyle';
import { APP_ROUTES } from '@/lib/config/routes';
import { ShieldCheck, FileSearch, Scale, BadgeCheck } from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  trust_clearview: ShieldCheck,
  trust_fairprice: FileSearch,
  trust_roi: BadgeCheck,
  trust_duediligence: Scale,
  trust_worldcheck: ShieldCheck,
};

const HREFS: Record<string, string> = {
  trust_clearview: APP_ROUTES.CLEARVIEW,
  trust_fairprice: `${APP_ROUTES.PRICING}#trust`,
  trust_roi: `${APP_ROUTES.PRICING}#trust`,
  trust_duediligence: `${APP_ROUTES.PRICING}#trust`,
  trust_worldcheck: `${APP_ROUTES.PRICING}#trust`,
};

const VISIBLE_IDS = ['trust_clearview', 'trust_fairprice', 'trust_roi', 'trust_duediligence'];

export function TrustAsAService() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { withResolvedRate } = useRevenueRates();

  const items = TRUST_ITEMS.filter(i => VISIBLE_IDS.includes(i.id)).map(withResolvedRate);

  return (
    <section className="px-4 pt-1 pb-6">
      <header className="mb-3">
        <h2 className="font-display text-[18px] leading-tight font-semibold text-foreground tracking-[-0.01em]">
          {isRu ? RE_TRUST_LABELS.trustBlock.ru : RE_TRUST_LABELS.trustBlock.en}
        </h2>
        <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug">
          {isRu ? RE_TRUST_LABELS.trustOneLiner.ru : RE_TRUST_LABELS.trustOneLiner.en}
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-2">
        {items.map(item => {
          const Icon = ICONS[item.id] ?? ShieldCheck;
          const href = HREFS[item.id] ?? '/pricing#trust';
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => navigate(href)}
                className="w-full h-full text-left rounded-[14px] border border-border bg-card hover:border-border-strong transition-colors px-3 py-2.5 flex flex-col gap-1.5 active:scale-[0.99]"
              >
                <Icon className="w-4 h-4 text-foreground" />
                <span className="text-[12.5px] font-semibold text-foreground leading-snug">
                  {isRu ? item.label.ru : item.label.en}
                </span>
                <span className="text-[12px] font-mono text-foreground/90 mt-auto">
                  {formatRevenueRate(item)}
                </span>
                {item.note && (
                  <span className="text-[10.5px] text-muted-foreground leading-snug">
                    {isRu ? item.note.ru : item.note.en}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
