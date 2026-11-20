/**
 * GoalEntryPage — goal-first entry for Stay · Live · Buy · Services.
 *
 * Pure navigation surface over existing verticals (see `goalEntries.ts`).
 * No fake metrics, no dead buttons: every tile links to a mounted route.
 */
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { APP_ROUTES } from '@/lib/config/routes';
import { GOAL_ENTRIES, isGoalId, type GoalLink } from '@/lib/nav/goalEntries';
import PropertySearchRedirect from '@/components/property/PropertySearchRedirect';
import '@/styles/cinematic-home.css';
import { clearPropertySearchQuery } from '@/lib/propertySearchQuery';
import { cn } from '@/lib/utils';
import ServicesIndex from '@/pages/services/ServicesIndex';
import { MarketplaceEntry } from '@/components/landing/MarketplaceEntry';
import { MarketplaceDiscoveryMenu } from '@/components/services/MarketplaceDiscoveryMenu';
import { PUBLIC_CONTENT_LAYOUT } from '@/design-system/ecosystemLayout';

export default function GoalEntryPage({ goal }: { goal: string }) {
  const { language } = useLanguage();
  const location = useLocation();

  if (goal === 'services') return <ServicesIndex />;
  if (goal === 'stay') {
    const params = new URLSearchParams(location.search);
    const hasCriteria = params.has('view') || clearPropertySearchQuery(params).toString() !== params.toString();
    return hasCriteria ? <PropertySearchRedirect defaults={{ mode: 'rent' }} /> : <Navigate replace state={location.state} to={`${APP_ROUTES.PROPERTY_RENT}${location.search}${location.hash}`} />;
  }

  if (!isGoalId(goal)) return <Navigate to={APP_ROUTES.DISCOVER} replace />;
  const entry = GOAL_ENTRIES[goal];
  const t = (v: { en: string; ru: string; th: string }) => pickLang(language, v);
  const title = t({ en: entry.en, ru: entry.ru, th: entry.th });

  const Tile = ({ link, large }: { link: GoalLink; large?: boolean }) => {
    const Icon = link.icon;
    return (
      <Link
        to={link.path}
        className={cn(
          'group flex items-start gap-3 border border-border bg-card p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          large && 'sm:p-5',
        )}
      >
        <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-foreground">{t({ en: link.en, ru: link.ru, th: link.th })}</span>
          <span className="block text-sm text-muted-foreground">
            {t({ en: link.descEn, ru: link.descRu, th: link.descTh })}
          </span>
        </span>
        <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    );
  };

  const seoTitles: Record<string, { en: string; ru: string; th: string }> = {
    buy: { en: 'Property for sale in Phuket', ru: 'Покупка недвижимости на Пхукете', th: 'ซื้ออสังหาริมทรัพย์ในภูเก็ต' },
    live: { en: 'Moving to and living in Phuket', ru: 'Переезд и проживание на Пхукете', th: 'ย้ายมาและใช้ชีวิตในภูเก็ต' },
  };
  const seoTitle = seoTitles[goal] ? t(seoTitles[goal]) : title;

  const buyHelp = goal === 'buy' ? entry.primary.find(link => link.path === APP_ROUTES.PROPERTY_CONSULTATION) : undefined;

  return (
    <AppLayout title={title} usePageContainer={false}>
      <SEOHead title={seoTitle} description={t({ en: entry.leadEn, ru: entry.leadRu, th: entry.leadTh })} />
      <div className={goal === 'buy' ? `${PUBLIC_CONTENT_LAYOUT.catalogue} pb-8` : 'mx-auto w-full journey-page max-w-6xl px-4 py-8 sm:py-12'}>
        {goal === 'buy' ? <MarketplaceEntry kind="buy" /> : <header className="mb-8">
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">myUNO · Phuket</p>
          <h1 className="font-serif text-4xl font-normal tracking-tight text-foreground sm:text-6xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {t({ en: entry.leadEn, ru: entry.leadRu, th: entry.leadTh })}
          </p>
        </header>}
        {goal === 'buy' ? <div className="space-y-3 py-4">
          <MarketplaceDiscoveryMenu
            title={t({ en: 'What would you like to buy?', ru: 'Что хотите купить?', th: 'คุณอยากซื้ออะไร?' })}
            testId="buy-discovery-menu"
            items={entry.primary.filter(link => link.path !== APP_ROUTES.PROPERTY_CONSULTATION).map(link => ({
              id: link.path, href: link.path, icon: link.icon, label: t(link),
            }))}
          />
          {buyHelp && <Link to={buyHelp.path} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4">
            {t(buyHelp)}<ArrowRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>}
        </div> : <section className="grid gap-3 sm:grid-cols-3">
          {entry.primary.map((l) => <Tile key={l.path} link={l} large />)}
        </section>}

        <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t({ en: 'Also useful', ru: 'Также пригодится', th: 'ที่เป็นประโยชน์' })}
        </h2>
        <section className="grid gap-3 sm:grid-cols-3">
          {entry.more.map((l) => <Tile key={l.path + l.en} link={l} />)}
        </section>
      </div>
    </AppLayout>
  );
}
