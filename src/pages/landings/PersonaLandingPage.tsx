/**
 * @file PersonaLandingPage.tsx
 * @description M6 · Track B.4 — динамический роут `/for/:persona`.
 *
 * Поведение (по `audits/M6-persona-landings.md` §3 Трек B.4):
 *  1. Берём `:persona` slug из URL.
 *  2. `findPersonaLandingBySlug(PERSONA_LANDINGS, slug)`:
 *     - не найдено → 404 (рендерим `<NotFound />` в текущем дереве, без redirect).
 *  3. `isLivePersonaLanding(landing)`:
 *     - false (status='draft' или нет SEO/контента) → тоже 404.
 *     - true → рендерим страницу.
 *
 * Контент-каркас live-страницы — намеренно скромный «коммит-ready» layout:
 * H1 / subtitle / pains / services / FAQ / primaryCta. Финальный визуал
 * (hero, cross-link «Лендинги по кластерам ↗», bundle pricing) — шаги
 * B.6/B.7. Здесь главное, чтобы шаг B.4 закрывал контракт «200 vs 404».
 *
 * SEO (`<LandingSeoHead />`) подключим в B.6. До тех пор используем
 * минимальный inline `<title>` через `document.title` для корректного
 * отображения вкладки в браузере — без react-helmet, чтобы не дублировать
 * поведение, которое появится в B.6.
 */
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  findPersonaLandingBySlug,
  isLivePersonaLanding,
  type PersonaLanding,
} from '@/lib/landings/types';
import { PERSONA_LANDINGS } from '@/content/landings/personaLandings';
import NotFound from '@/pages/NotFound';
import { Button } from '@/components/ui/button';
import LandingSeoHead from '@/components/seo/LandingSeoHead';

interface PersonaLandingViewProps {
  landing: PersonaLanding;
}

const PersonaLandingView = ({ landing }: PersonaLandingViewProps) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = <T,>(pair: { ru: T; en: T }): T => (isRu ? pair.ru : pair.en);

  return (
    <AppLayout>
      <LandingSeoHead landing={landing} type="persona" language={language as 'ru' | 'en'} />
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

        {/* Pains */}
        {landing.pains.length > 0 ? (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              {isRu ? 'Что вы решаете' : 'What you solve'}
            </h2>
            <ul className="space-y-2 text-base text-foreground/90">
              {landing.pains.map((pain, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(pain)}</span>
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

const PersonaLandingPage = () => {
  const { persona: slug } = useParams<{ persona: string }>();

  if (!slug) {
    return <NotFound />;
  }

  const landing = findPersonaLandingBySlug(PERSONA_LANDINGS, slug);

  if (!landing || !isLivePersonaLanding(landing)) {
    return <NotFound />;
  }

  return <PersonaLandingView landing={landing} />;
};

export default PersonaLandingPage;
