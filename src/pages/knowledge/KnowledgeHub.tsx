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
  const { data: sections, isLoading } = useKnowledgeSections();

  const cityName = getCityName(language as 'en' | 'ru' | 'th');
  const pageTitle = language === 'ru' 
    ? `Справочник знаний — ${cityName}` 
    : `Knowledge Hub — ${cityName}`;

  // Group sections for display
  const sectionGroups = KNOWLEDGE_SECTIONS.map(section => {
    const items = sections?.filter(s => s.section === section.id) || [];
    return {
      ...section,
      label: language === 'ru' ? section.labelRu : section.labelEn,
      count: items.length,
      summary: items[0]?.summary || '',
    };
  });

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
            className="w-full text-left rounded-none border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5 hover:border-primary/60 transition-colors flex items-center gap-4"
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
