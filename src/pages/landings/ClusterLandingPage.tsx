/**
 * @file ClusterLandingPage.tsx
 * @description M6 · Track B.5 — динамический роут `/cluster/:cluster`.
 *
 * Симметрично `PersonaLandingPage.tsx` (B.4):
 *  1. Берём `:cluster` slug из URL.
 *  2. `findClusterLandingBySlug(CLUSTER_LANDINGS, slug)` → не найдено → 404.
 *  3. `isLiveClusterLanding(landing)` → false (draft / нет SEO / пустые
 *     jobs/services/faq) → тоже 404.
 *  4. Иначе — рендерим страницу.
 *
 * Layout — копия каркаса persona-страницы с двумя различиями:
 *  - вместо `pains` показываем `jobs` (lifecycle-фразы из §5 канона);
 *  - блок «Связанные персоны» (`relatedPersonas`) — ссылки на `/for/:slug`
 *    тех персон, для которых кластер актуален. Это и есть cross-link,
 *    про который говорил план в B.6 — но сама ссылка не зависит от
 *    SEO-головы, поэтому делаем её сразу. Линкуем только на live-персон
 *    (через `isLivePersonaLanding`), остальные мы и так отдадим 404.
 *
 * SEO-блок (`<LandingSeoHead />`) появится в B.6.
 */
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  findClusterLandingBySlug,
  isLiveClusterLanding,
  isLivePersonaLanding,
  type ClusterLanding,
} from '@/lib/landings/types';
import { CLUSTER_LANDINGS } from '@/content/landings/clusterLandings';
import { PERSONA_LANDINGS } from '@/content/landings/personaLandings';
import NotFound from '@/pages/NotFound';
import { Button } from '@/components/ui/button';

interface ClusterLandingViewProps {
  landing: ClusterLanding;
}

const ClusterLandingView = ({ landing }: ClusterLandingViewProps) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = <T,>(pair: { ru: T; en: T }): T => (isRu ? pair.ru : pair.en);

  // Минимальный document.title до подключения <LandingSeoHead /> (B.6).
  useEffect(() => {
    const prev = document.title;
    const titleSource = landing.seo?.metaTitle ?? landing.h1;
    document.title = t(titleSource);
    return () => {
      document.title = prev;
    };
  }, [landing, isRu]);

  /**
   * Cross-link «По персонам ↗» — фильтруем `relatedPersonas` через
   * `isLivePersonaLanding`, чтобы не вести в 404 для draft-персон.
   * На стадии B.5 (PERSONA_LANDINGS все draft) список будет пустым —
   * это ожидаемо: оживёт после B.7 без правки этой страницы.
   */
  const livePersonaLinks = useMemo(() => {
    const codes = new Set(landing.relatedPersonas);
    return PERSONA_LANDINGS.filter(
      (p) => codes.has(p.personaCode) && isLivePersonaLanding(p),
    );
  }, [landing.relatedPersonas]);

  return (
    <AppLayout>
      <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Hero */}
        <header className="mb-10">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            {t(landing.h1)}
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {t(landing.subtitle)}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href={landing.primaryCta.href}>{t(landing.primaryCta.label)}</a>
            </Button>
            {landing.secondaryCta ? (
              <Button asChild size="lg" variant="outline">
                <a href={landing.secondaryCta.href}>
                  {t(landing.secondaryCta.label)}
                </a>
              </Button>
            ) : null}
          </div>
        </header>

        {/* Jobs (lifecycle-фразы из §5 канона) */}
        {landing.jobs.length > 0 ? (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              {isRu ? 'Что вы решаете' : 'What you solve'}
            </h2>
            <ul className="space-y-2 text-base text-foreground/90">
              {landing.jobs.map((job, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(job)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Services */}
        {landing.services.length > 0 ? (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              {isRu ? 'Услуги' : 'Services'}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {landing.services.map((service) => (
                <li key={service.slug}>
                  <a
                    href={service.href}
                    className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/60"
                  >
                    <div className="font-medium text-foreground">
                      {t(service.label)}
                    </div>
                    {service.oneLiner ? (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {t(service.oneLiner)}
                      </div>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* FAQ */}
        {landing.faq.length > 0 ? (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              {isRu ? 'Вопросы и ответы' : 'Questions & answers'}
            </h2>
            <dl className="space-y-5">
              {landing.faq.map((entry, i) => (
                <div key={i}>
                  <dt className="font-medium text-foreground">{t(entry.q)}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">
                    {t(entry.a)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {/* Cross-link: live persona landings related to this cluster */}
        {livePersonaLinks.length > 0 ? (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              {isRu ? 'По персонам' : 'By persona'}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {livePersonaLinks.map((p) => (
                <li key={p.slug}>
                  <a
                    href={`/for/${p.slug}`}
                    className="block rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/60"
                  >
                    {t(p.h1)}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Repeat CTA */}
        <div className="border-t border-border pt-8">
          <Button asChild size="lg">
            <a href={landing.primaryCta.href}>{t(landing.primaryCta.label)}</a>
          </Button>
          {landing.primaryCta.subtitle ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {t(landing.primaryCta.subtitle)}
            </p>
          ) : null}
        </div>
      </article>
    </AppLayout>
  );
};

const ClusterLandingPage = () => {
  const { cluster: slug } = useParams<{ cluster: string }>();

  if (!slug) {
    return <NotFound />;
  }

  const landing = findClusterLandingBySlug(CLUSTER_LANDINGS, slug);

  if (!landing || !isLiveClusterLanding(landing)) {
    return <NotFound />;
  }

  return <ClusterLandingView landing={landing} />;
};

export default ClusterLandingPage;
