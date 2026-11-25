import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '@/components/uno/PageContainer';
import { SEOHead } from '@/components/seo';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, MapPin, Compass, ChevronRight, Globe } from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { useLocation } from '@/contexts/LocationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useKnowledgeSections, KNOWLEDGE_SECTIONS } from '@/hooks/useLocationKnowledge';
import { KnowledgeCard, QuickFactsGrid, DosDontsCard, EmergencyContacts } from '@/components/knowledge';

export default function KnowledgeHub() {
  const navigate = useNavigate();
  const { currentCity, getCityName } = useLocation();
  const { language } = useLanguage();
  const { data: sections, isLoading, isError, refetch } = useKnowledgeSections();
  const isRu = language === 'ru';

  const cityName = getCityName(language as 'en' | 'ru' | 'th');
  const pageTitle = language === 'ru'
    ? `Справочник знаний — ${cityName}`
    : `Knowledge Hub — ${cityName}`;

  // These sections have dedicated cards lower on the page (Cultural Etiquette
  // and Emergency Contacts), so they are excluded from the generic grid to
  // avoid showing them twice.
  const HUB_GRID_EXCLUDED = ['emergency', 'dos-donts'];

  // Group sections for display — only those with published content and not
  // already surfaced by a dedicated card.
  const sectionGroups = KNOWLEDGE_SECTIONS
    .filter(section => !HUB_GRID_EXCLUDED.includes(section.id))
    .map(section => {
      const items = sections?.filter(s => s.section === section.id) || [];
      return {
        ...section,
        label: language === 'ru' ? section.labelRu : section.labelEn,
        count: items.length,
        summary: items[0]?.summary || '',
      };
    })
    .filter(section => section.count > 0);

  const tracks = [
    { to: APP_ROUTES.KNOWLEDGE_PILLARS, ru: 'Покупка', en: 'Buying', subRu: 'Квоты, сделки, налоги', subEn: 'Quotas, deals, taxes' },
    { to: APP_ROUTES.RELOCATION_GUIDES, ru: 'Переезд', en: 'Moving', subRu: 'Визы, жильё, школы', subEn: 'Visas, housing, schools' },
    { to: APP_ROUTES.AREA_INDEX, ru: 'Районы', en: 'Areas', subRu: 'Путеводители по районам', subEn: 'Area guides' },
    { to: APP_ROUTES.CLEARVIEW, ru: 'ClearView', en: 'ClearView', subRu: 'Методика оценки проектов', subEn: 'Project rating method' },
  ];

  return (
    <>
      <SEOHead 
        title={pageTitle}
        description={language === 'ru' 
          ? `Все что нужно знать о ${cityName}: культура, законы, госорганы, экстренные контакты`
          : `Everything you need to know about ${cityName}: culture, laws, government, emergency contacts`
        }
      />
      
      <PageContainer className="pb-32">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BackButton fallbackPath={APP_ROUTES.DISCOVER} variant="ghost" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              {language === 'ru' ? 'Справочник знаний' : 'Knowledge Hub'}
            </h1>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="h-4 w-4" />
              <span>{cityName}</span>
              {currentCity?.flag && <span>{currentCity.flag}</span>}
            </div>
          </div>
        </div>

        <p className="-mt-3 mb-6 max-w-2xl text-sm text-muted-foreground">
          {isRu
            ? 'Гайды о жизни и покупке недвижимости в Таиланде. У каждой статьи указана дата обновления.'
            : 'Guides for living in and buying property in Thailand. Every article shows its update date.'}
        </p>

        {/* Tracks (design MK4) */}
        <nav aria-label={isRu ? 'Направления' : 'Tracks'} className="mb-8">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {tracks.map((track) => (
              <li key={track.to}>
                <Link
                  to={track.to}
                  className="flex h-full min-h-20 flex-col justify-between rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="text-sm font-semibold text-foreground">{isRu ? track.ru : track.en}</span>
                  <span className="mt-1 text-xs text-muted-foreground">{isRu ? track.subRu : track.subEn}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Quick Facts */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-foreground">
            {language === 'ru' ? 'Основные факты' : 'Quick Facts'}
          </h2>
          <QuickFactsGrid />
        </section>

        {/* Pillar Guides CTA — canonical knowledge pillars (M9.6) */}
        <section className="mb-8">
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.KNOWLEDGE_PILLARS)}
            className="w-full text-left rounded-none border border-primary/30 bg-card p-5 hover:border-primary/60 transition-colors flex items-center gap-4"
          >
            <div className="h-12 w-12 rounded-none bg-primary/15 flex items-center justify-center shrink-0">
              <Compass className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground">
                {language === 'ru' ? 'Канонические гайды' : 'Pillar guides'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {language === 'ru'
                  ? '10 опорных материалов: покупка недвижимости, визы, налоги, управление объектами'
                  : '10 pillar guides: buying property, visas, taxes, property management'}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </button>
        </section>

        {/* Phuket relocation guides (bilingual articles) */}
        <section className="mb-8">
          <Link
            to={APP_ROUTES.RELOCATION_GUIDES}
            className="w-full text-left rounded-none border border-border bg-card p-5 hover:border-primary/50 transition-colors flex items-center gap-4"
          >
            <div className="h-12 w-12 rounded-none bg-primary/10 flex items-center justify-center shrink-0">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground">
                {language === 'ru' ? 'Переезд на Пхукет' : 'Moving to Phuket'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {language === 'ru'
                  ? 'Визы, TM30, жильё, школы, банки — отдельные гайды с чеклистом в приложении.'
                  : 'Visas, TM30, housing, schools, banking — dedicated guides plus in-app checklist.'}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </Link>
        </section>

        {/* Knowledge Sections Grid */}
        {isError && (
          <section role="alert" className="mb-8 border border-border bg-card p-4">
            <p className="text-sm text-foreground">
              {isRu
                ? 'Не удалось загрузить разделы справочника. Проверьте соединение и попробуйте снова.'
                : "We couldn't load the knowledge sections. Check your connection and try again."}
            </p>
            <button type="button" onClick={() => void refetch()} className="mt-2 min-h-11 text-sm font-medium text-primary hover:underline">
              {isRu ? 'Повторить' : 'Try again'}
            </button>
          </section>
        )}

        {!isError && (isLoading || sectionGroups.length > 0) && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3 text-foreground">
              {language === 'ru' ? 'Разделы справочника' : 'Knowledge Sections'}
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-20 w-full rounded-none" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {sectionGroups.map(section => (
                  <KnowledgeCard
                    key={section.id}
                    section={section.id}
                    title={section.label}
                    summary={section.summary}
                    icon={section.icon}
                    articleCount={section.count}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Do's & Don'ts Preview */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-foreground">
            {language === 'ru' ? 'Культурный этикет' : 'Cultural Etiquette'}
          </h2>
          <DosDontsCard />
        </section>

        {/* Emergency Contacts */}
        <section>
          <EmergencyContacts citySlug={currentCity?.slug || 'phuket'} />
        </section>
      </PageContainer>
    </>
  );
}
