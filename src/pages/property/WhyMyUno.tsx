/**
 * WhyMyUno — calm explainer of how the platform differs from Cian / Airbnb / private agents.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

const COMPARISONS = [
  {
    against: { ru: 'В отличие от классифайдов', en: 'Unlike classifieds' },
    line: {
      ru: 'Каждый проект проверен по методике ClearView. Цена комиссии и сторона, которая её платит, указаны открыто.',
      en: 'Every project is verified under the ClearView methodology. Commission rate and paying party are disclosed.',
    },
  },
  {
    against: { ru: 'В отличие от платформ краткосрочной аренды', en: 'Unlike short-term rental platforms' },
    line: {
      ru: 'Поддерживаются долгосрочная аренда, перепродажа и инвестиционные сделки от 200 000 USD с эскроу.',
      en: 'Long-term rent, resale and investment deals from USD 200 000 with escrow are supported.',
    },
  },
  {
    against: { ru: 'В отличие от частных агентов', en: 'Unlike private agents' },
    line: {
      ru: 'Открытые ставки, фиксированный минимум, аудит-маркер на каждой операции.',
      en: 'Disclosed rates, fixed minimum fees, audit marker on each transaction.',
    },
  },
];

export default function WhyMyUno() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <AppLayout showHeader={false}>
      <div className="min-h-screen bg-background pb-16">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
          <div className="px-4 py-3 flex items-center gap-3">
            <Link to={APP_ROUTES.PROPERTY} aria-label={isRu ? 'Назад' : 'Back'}>
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <h1 className="font-display text-[16px] font-semibold text-foreground truncate">
              {isRu ? 'Как устроена платформа' : 'How the platform works'}
            </h1>
          </div>
        </header>

        <section className="px-4 py-5">
          <p className="text-[13.5px] text-foreground leading-relaxed">
            {isRu
              ? 'Платформа объединяет каталог недвижимости, независимую проверку проектов и сопровождение сделок. Все ставки и сборы указаны на странице тарифов.'
              : 'The platform unifies a real-estate catalogue, independent project verification and deal support. All rates and fees are listed on the pricing page.'}
          </p>
        </section>

        <section className="px-4 pb-5 space-y-2">
          {COMPARISONS.map((c, i) => (
            <div key={i} className="rounded-[12px] border border-border bg-card px-3.5 py-3">
              <h2 className="text-[13.5px] font-semibold text-foreground">
                {isRu ? c.against.ru : c.against.en}
              </h2>
              <p className="text-[12.5px] text-muted-foreground mt-1 leading-snug">
                {isRu ? c.line.ru : c.line.en}
              </p>
            </div>
          ))}
        </section>

        <section className="px-4 pb-6 space-y-2">
          <Link
            to={APP_ROUTES.PRICING}
            className="block w-full text-center rounded-[12px] bg-foreground text-background py-3 text-[14px] font-semibold"
          >
            {isRu ? 'Тарифы и комиссии' : 'Pricing and fees'}
          </Link>
          <Link
            to={APP_ROUTES.CLEARVIEW}
            className="block w-full text-center rounded-[12px] border border-border bg-card text-foreground py-3 text-[13.5px]"
          >
            {isRu ? 'Методика ClearView' : 'ClearView methodology'}
          </Link>
        </section>
      </div>
    </AppLayout>
  );
}
