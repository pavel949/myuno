/**
 * Discover Page — Visual Life Hub
 * 
 * Photo-first approach with clean typography and smooth animations.
 * Airbnb Experiences + Klook + Apple TV inspired.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { COMPANY_CONTACTS, getWhatsAppUrl, getTelLink } from '@/lib/config/contacts';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Phone, MessageCircle, Headphones } from 'lucide-react';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { VERTICAL_GROUPS } from '@/lib/verticalGroups';
import { resolveVerticalItem } from '@/lib/resolveVerticalItem';
import { resolveIcon } from '@/lib/iconMap';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { DiscoverHero } from '@/components/discover/DiscoverHero';
import { Surface } from '@/components/ui/surface';
import { SectionHeader } from '@/components/ds';

import { LifeSituationsGrid } from '@/components/discover/LifeSituationsGrid';
import { AllServicesGrid } from '@/components/discover/AllServicesGrid';
import { ContextualRecommendations } from '@/components/discover/ContextualRecommendations';
import { MyJourneyRecommendations } from '@/components/discover/MyJourneyRecommendations';
import { AudienceFilterTabs, type AudienceFilter } from '@/components/discover/AudienceFilterTabs';
import { useUserPersonas } from '@/hooks/useUserPersonas';

// ── Search data ───────────────────────────────────
const LIFE_CONTEXTS_SEARCH = [
  { code: 'arrival', titleEn: 'Arrival & First Days', titleRu: 'Прибытие и первые дни', route: '/life/arrival' },
  { code: 'living', titleEn: 'Daily Life', titleRu: 'Повседневная жизнь', route: '/life/living' },
  { code: 'leisure', titleEn: 'Leisure & Activities', titleRu: 'Отдых и впечатления', route: '/life/leisure' },
  { code: 'health', titleEn: 'Health', titleRu: 'Здоровье', route: '/life/health' },
  { code: 'family', titleEn: 'Family & Kids', titleRu: 'Семья и дети', route: '/life/family' },
  { code: 'property', titleEn: 'Property', titleRu: 'Недвижимость', route: '/life/property' },
  { code: 'relocation', titleEn: 'Relocation & Legals', titleRu: 'Переезд и документы', route: '/life/relocation' },
  { code: 'business', titleEn: 'Business & Work', titleRu: 'Бизнес и работа', route: '/life/business' },
  { code: 'sports', titleEn: 'Sports & Fitness', titleRu: 'Спорт и фитнес', route: '/life/sports' },
  { code: 'nightlife', titleEn: 'Nightlife & Social', titleRu: 'Ночная жизнь', route: '/life/nightlife' },
  { code: 'shopping', titleEn: 'Shopping', titleRu: 'Шопинг', route: '/life/shopping' },
  { code: 'education', titleEn: 'Education', titleRu: 'Образование', route: '/life/education' },
  { code: 'pets', titleEn: 'Pet Care', titleRu: 'Питомцы', route: '/life/pets' },
  { code: 'visa_travel', titleEn: 'Visa & Travel', titleRu: 'Виза и поездки', route: '/life/visa_travel' },
  { code: 'planning', titleEn: 'Trip Planning', titleRu: 'Планирование поездки', route: '/life/planning' },
  { code: 'wedding_event', titleEn: 'Wedding & Events', titleRu: 'Свадьба и праздники', route: '/life/wedding_event' },
  { code: 'retirement_living', titleEn: 'Retirement Living', titleRu: 'Пенсия на Пхукете', route: '/life/retirement_living' },
];


export default function Discover() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const [searchQuery, setSearchQuery] = useState('');
  const { personas } = useUserPersonas();

  const defaultAudience: AudienceFilter = personas.includes('resident') ? 'resident'
    : personas.includes('tourist') ? 'tourist'
    : 'all';

  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>(defaultAudience);

  const handleNav = useCallback((path: string) => {
    triggerHaptic('light');
    navigate(path);
  }, [navigate]);

  const allItems = useMemo(() => {
    return VERTICAL_GROUPS.flatMap(g =>
      g.items
        .map(item => resolveVerticalItem(item, language))
        .filter(Boolean) as NonNullable<ReturnType<typeof resolveVerticalItem>>[]
    );
  }, [language]);

  const isSearching = searchQuery.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return { verticals: [] as typeof allItems, contexts: [] as typeof LIFE_CONTEXTS_SEARCH };
    const q = searchQuery.toLowerCase();
    const verticalResults = allItems.filter(item => item.label.toLowerCase().includes(q));
    const contextResults = LIFE_CONTEXTS_SEARCH.filter(ctx => {
      const title = isRu ? ctx.titleRu : ctx.titleEn;
      return title.toLowerCase().includes(q);
    });
    return { verticals: verticalResults, contexts: contextResults };
  }, [allItems, searchQuery, isSearching, isRu]);

  return (
    <MiniAppLayout
      title={isRu ? 'Жизнь на Пхукете' : 'Life in Phuket'}
      subtitle={isRu ? 'Чем мы можем помочь?' : 'How can we help?'}
      fallbackPath="/"
      showHero={false}
      showCategories={false}
      showFilter={false}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={isRu ? 'Поиск услуг и ситуаций...' : 'Search services & situations...'}
    >
      {/* ── Search Results ──────────────────────────────── */}
      {isSearching && (
        <div className="space-y-4">
          {searchResults.contexts?.length > 0 && (
            <div className="space-y-2">
              <SectionHeader
                title={isRu ? 'Ситуации' : 'Life situations'}
                size="sm"
              />
              {searchResults.contexts.map((ctx) => (
                <button
                  key={ctx.code}
                  onClick={() => handleNav(ctx.route)}
                  className="w-full flex items-center gap-3 p-3 rounded-none bg-card border border-border/50 hover:border-primary/30 active:scale-[0.99] transition-all touch-manipulation text-left"
                >
                  <span className="text-sm font-medium text-foreground">{isRu ? ctx.titleRu : ctx.titleEn}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 ml-auto" />
                </button>
              ))}
            </div>
          )}

          {searchResults.verticals?.length > 0 && (
            <div className="space-y-2">
              <SectionHeader
                title={isRu ? 'Сервисы' : 'Services'}
                size="sm"
              />
              {searchResults.verticals.map((item) => {
                const I = resolveIcon(item.icon);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.route)}
                    className="w-full flex items-center gap-3 p-3 rounded-none bg-card border border-border/50 hover:border-primary/30 active:scale-[0.99] transition-all touch-manipulation text-left"
                  >
                    <div className="w-10 h-10 rounded-none bg-muted flex items-center justify-center flex-shrink-0">
                      <I className="w-5 h-5 text-foreground/70" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 ml-auto" />
                  </button>
                );
              })}
            </div>
          )}

          {searchResults.verticals?.length === 0 && searchResults.contexts?.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {isRu ? 'Ничего не найдено' : 'Nothing found'}
            </div>
          )}
        </div>
      )}

      {/* ── Main Content ────────────────────────────────── */}
      {!isSearching && (
        <div className="space-y-8">
          {/* Hero Banner */}
          <DiscoverHero />

          {/* Personalised journey from /start onboarding */}
          <MyJourneyRecommendations />

          {/* Contextual Recommendations (LifeOS-aware) */}
          <ContextualRecommendations />

          {/* Life Situations 2x Grid */}
          <LifeSituationsGrid />

          {/* Separator */}
          <div className="h-px bg-border/50" />

          {/* Audience filter for services */}
          <AudienceFilterTabs value={audienceFilter} onChange={setAudienceFilter} />

          {/* All Services Grid */}
          <AllServicesGrid audienceFilter={audienceFilter} />

          {/* Separator */}
          <div className="h-px bg-border/50" />

          {/* Support block — DS2.0 Surface */}
          <Surface variant="muted" bordered padding="md" radius="2xl" className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {isRu ? 'Не знаете, с чего начать?' : "Not sure where to start?"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRu ? 'Наш менеджер ответит за 15 минут' : 'Our manager will respond in 15 min'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-none bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-transform touch-manipulation"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
              <a
                href={getTelLink()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-none bg-card border border-border text-sm font-medium text-foreground active:scale-[0.98] transition-transform touch-manipulation"
              >
                <Phone className="w-4 h-4" />
                <span>{isRu ? 'Позвонить' : 'Call'}</span>
              </a>
            </div>
          </Surface>
        </div>
      )}
    </MiniAppLayout>
  );
}
