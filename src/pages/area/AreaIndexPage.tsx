/**
 * @file AreaIndexPage.tsx
 * @description Public index of Phuket area landings at `/area`.
 * Lists all 10 areas with their key stats and links to `/area/:slug`.
 */
import { Link } from 'react-router-dom';
import { MapPin, Star, TrendingUp } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageShell } from '@/components/page/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { AREA_LANDINGS } from '@/content/landings/areaLandings';

const AreaIndexPage = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const title = isRu
    ? 'Районы Пхукета — гид по локациям · myUNO'
    : 'Phuket areas — location guide · myUNO';
  const description = isRu
    ? 'Сравните 10 районов Пхукета: средняя цена за м², доходность, инфраструктура, плюсы и минусы. Аренда и новостройки в каждом районе.'
    : 'Compare 10 Phuket areas: price per sqm, rental yield, infrastructure, pros and cons. Rentals and off-plan in every district.';

  return (
    <AppLayout>
      <Helmet>
        <html lang={language} />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href="https://myuno.app/area" />
      </Helmet>

      <PageShell width="wide">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {isRu ? 'Районы Пхукета' : 'Phuket areas'}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            {isRu
              ? 'Цена за м², доходность, инфраструктура и связки с проверенными проектами — по каждому из 10 ключевых районов острова.'
              : 'Price per sqm, rental yield, infrastructure and curated projects — for each of the 10 key districts.'}
          </p>
        </header>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AREA_LANDINGS.map(({ slug, area }) => {
            const beach =
              area.distance_beach_km < 1
                ? `${(area.distance_beach_km * 1000).toFixed(0)} ${isRu ? 'м' : 'm'}`
                : `${area.distance_beach_km} ${isRu ? 'км' : 'km'}`;
            const name = isRu ? area.name_ru : area.name_en;
            const desc = isRu ? area.description_ru : area.description_en;
            return (
              <li key={slug}>
                <Link
                  to={`/area/${slug}`}
                  className="group block h-full rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/60"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{name}</h2>
                      {isRu ? (
                        <p className="text-xs text-muted-foreground">{area.name_en}</p>
                      ) : null}
                    </div>
                    <div
                      className="flex shrink-0 gap-0.5"
                      aria-label={`${area.investment_rating}/5`}
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={
                            i < area.investment_rating
                              ? 'h-3.5 w-3.5 fill-primary text-primary'
                              : 'h-3.5 w-3.5 text-muted-foreground/40'
                          }
                          aria-hidden
                        />
                      ))}
                    </div>
                  </div>

                  <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{desc}</p>

                  <dl className="grid grid-cols-3 gap-3 border-t border-border pt-3 text-center">
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {isRu ? 'за м²' : 'per sqm'}
                      </dt>
                      <dd className="text-sm font-semibold text-foreground">
                        ฿{(area.avg_price_sqm / 1000).toFixed(0)}K
                      </dd>
                    </div>
                    <div className="border-x border-border">
                      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {isRu ? 'доход.' : 'yield'}
                      </dt>
                      <dd className="flex items-center justify-center gap-1 text-sm font-semibold text-foreground">
                        <TrendingUp className="h-3 w-3" aria-hidden />
                        {area.avg_yield}%
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {isRu ? 'до пляжа' : 'to beach'}
                      </dt>
                      <dd className="flex items-center justify-center gap-1 text-sm font-semibold text-foreground">
                        <MapPin className="h-3 w-3" aria-hidden />
                        {beach}
                      </dd>
                    </div>
                  </dl>

                  <span className="mt-4 block text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
                    {isRu ? 'Открыть профиль района →' : 'Open area profile →'}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </PageShell>
    </AppLayout>
  );
};

export default AreaIndexPage;
