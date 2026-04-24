/**
 * @file MandateLanding.tsx
 * @description M10b · IPP §4G — Deal Room stub под `/property/mandate`.
 *
 * Это minimal stub: invite-only access будет в M11. Сейчас — landing page
 * с описанием Deal Room + form для запроса access. Используется P9 (HNW)
 * persona landing как primary CTA target.
 */
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import LandingSeoHead from '@/components/seo/LandingSeoHead';

const MandateLanding = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = <T,>(p: { ru: T; en: T }): T => (isRu ? p.ru : p.en);

  const seoLanding = {
    personaCode: 'P9' as const,
    slug: 'mandate',
    status: 'live' as const,
    h1: { ru: 'Deal Room', en: 'Deal Room' },
    subtitle: { ru: '', en: '' },
    pains: [],
    services: [],
    faq: [],
    primaryCta: { label: { ru: '', en: '' }, href: '#' },
    seo: {
      metaTitle: { ru: 'Deal Room — закрытый шорт-лист myUNO', en: 'Deal Room — myUNO private shortlist' },
      metaDescription: {
        ru: 'Закрытый канал недвижимости Пхукета для частного капитала: First Look объекты, NDA, юрист и налоговый консультант на одном договоре.',
        en: 'Private Phuket real-estate channel for HNW capital: First Look properties, NDA, lawyer and tax advisor under one engagement.',
      },
      ogImage: 'https://myuno.app/og/default-og.jpg',
      canonicalPath: '/property/mandate',
      hreflangAlternates: [
        { lang: 'ru' as const, href: 'https://myuno.app/property/mandate?lang=ru' },
        { lang: 'en' as const, href: 'https://myuno.app/property/mandate?lang=en' },
      ],
    },
  };

  return (
    <AppLayout>
      <LandingSeoHead landing={seoLanding} type="persona" language={language as 'ru' | 'en'} />
      <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
            {t({ ru: 'Только по приглашению', en: 'Invite-only' })}
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            {t({ ru: 'Deal Room', en: 'Deal Room' })}
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {t({
              ru: 'Закрытый канал недвижимости Пхукета для клиентов с мандатом. First Look объекты до публичной выдачи, юрист и налоговый консультант на одном договоре, NDA до раскрытия.',
              en: 'A private Phuket real-estate channel for clients under mandate. First Look properties before public release, lawyer and tax advisor under one engagement, NDA before disclosure.',
            })}
          </p>
        </header>

        <section className="mb-10 grid gap-4 sm:grid-cols-2">
          {[
            { ru: 'First Look — за 7–14 дней до публичной выдачи', en: 'First Look — 7–14 days before public listing' },
            { ru: 'Шорт-лист 5–8 объектов под ваш мандат', en: 'Shortlist of 5–8 properties matching your mandate' },
            { ru: 'NDA подписывается до раскрытия объектов', en: 'NDA signed before any disclosure' },
            { ru: 'Юрист, налоговый консультант, asset manager — единый договор', en: 'Lawyer, tax advisor, asset manager — single engagement' },
          ].map((item, i) => (
            <div key={i} className="rounded-none border border-border bg-card p-4">
              <p className="text-sm text-foreground/90">{t(item)}</p>
            </div>
          ))}
        </section>

        <section className="mb-10 rounded-none border border-border bg-muted/30 p-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {t({ ru: 'Как получить доступ', en: 'How to get access' })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t({
              ru: 'Минимальный портфель от 15 млн THB (~$420K) или 1+ сделка с myUNO в течение года. Запросите шорт-лист — партнёр свяжется в течение 24 часов.',
              en: 'Minimum portfolio from 15M THB (~$420K) or 1+ closed deal with myUNO within a year. Request a shortlist — a partner will respond within 24 hours.',
            })}
          </p>
        </section>

        <div className="border-t border-border pt-8">
          <Button asChild size="lg">
            <a href="/for/hnw">{t({ ru: 'Запросить шорт-лист', en: 'Request a shortlist' })}</a>
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            {t({ ru: 'Конфиденциально. Без публикации.', en: 'Confidential. No public disclosure.' })}
          </p>
        </div>
      </article>
    </AppLayout>
  );
};

export default MandateLanding;
