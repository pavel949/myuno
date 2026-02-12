/**
 * Discover Page — Visual Life Hub
 * 
 * Photo-first approach with clean typography and smooth animations.
 * Airbnb Experiences + Klook + Apple TV inspired.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Phone, MessageCircle, Headphones } from 'lucide-react';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { VERTICALS } from '@/lib/verticals';
import { VERTICAL_GROUPS, type VerticalGroupItem } from '@/lib/verticalGroups';
import { resolveIcon } from '@/lib/iconMap';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { DiscoverHero } from '@/components/discover/DiscoverHero';
import { FeaturedStrip } from '@/components/discover/FeaturedStrip';
import { LifeSituationsGrid } from '@/components/discover/LifeSituationsGrid';
import { AllServicesGrid } from '@/components/discover/AllServicesGrid';

// ── Search data ───────────────────────────────────
const LIFE_CONTEXTS_SEARCH = [
  { code: 'arrival', titleEn: 'Arrival & First Days', titleRu: 'Прибытие и первые дни', route: '/life/arrival' },
  { code: 'living', titleEn: 'Daily Life', titleRu: 'Повседневная жизнь', route: '/life/living' },
  { code: 'leisure', titleEn: 'Leisure & Experiences', titleRu: 'Отдых и впечатления', route: '/life/leisure' },
  { code: 'health', titleEn: 'Health & Safety', titleRu: 'Здоровье и безопасность', route: '/life/health' },
  { code: 'family', titleEn: 'Family & Kids', titleRu: 'Семья и дети', route: '/life/family' },
  { code: 'property', titleEn: 'Property & Investment', titleRu: 'Недвижимость', route: '/life/property' },
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

function resolveItem(item: VerticalGroupItem, language: string) {
  if (item.verticalId) {
    const v = Object.values(VERTICALS).find(v => v.id === item.verticalId);
    if (!v) return null;
    return {
      id: v.id,
      icon: v.icon,
      label: language === 'ru' ? v.labelRu : v.labelEn,
      route: `/${v.plural}`,
    };
  }
  return {
    id: item.route || '',
    icon: item.icon || '📦',
    label: language === 'ru' ? (item.labelRu || '') : (item.labelEn || ''),
    route: item.route || '/',
  };
}

export default function Discover() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const [searchQuery, setSearchQuery] = useState('');

  const handleNav = useCallback((path: string) => {
    triggerHaptic('light');
    navigate(path);
  }, [navigate]);

  const allItems = useMemo(() => {
    return VERTICAL_GROUPS.flatMap(g =>
      g.items
        .map(item => resolveItem(item, language))
        .filter(Boolean) as NonNullable<ReturnType<typeof resolveItem>>[]
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
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {isRu ? 'Ситуации' : 'Life situations'}
              </p>
              {searchResults.contexts.map((ctx) => (
                <button
                  key={ctx.code}
                  onClick={() => handleNav(ctx.route)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 active:scale-[0.99] transition-all touch-manipulation text-left"
                >
                  <span className="text-sm font-medium text-foreground">{isRu ? ctx.titleRu : ctx.titleEn}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 ml-auto" />
                </button>
              ))}
            </div>
          )}

          {searchResults.verticals?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {isRu ? 'Сервисы' : 'Services'}
              </p>
              {searchResults.verticals.map((item) => {
                const I = resolveIcon(item.icon);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.route)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 active:scale-[0.99] transition-all touch-manipulation text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
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

          {/* Featured Services Strip */}
          <FeaturedStrip />

          {/* Life Situations 2x Grid */}
          <LifeSituationsGrid />

          {/* Separator */}
          <div className="h-px bg-border/50" />

          {/* All Services Grid */}
          <AllServicesGrid />

          {/* Separator */}
          <div className="h-px bg-border/50" />

          {/* Support block */}
          <div className="rounded-2xl bg-muted/30 border border-border/50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
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
                href="https://wa.me/66922407355"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-transform touch-manipulation"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
              <a
                href="tel:+66922407355"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-sm font-medium text-foreground active:scale-[0.98] transition-transform touch-manipulation"
              >
                <Phone className="w-4 h-4" />
                <span>{isRu ? 'Позвонить' : 'Call'}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </MiniAppLayout>
  );
}
