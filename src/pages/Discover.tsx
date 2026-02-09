/**
 * Discover Page — Life Context Hub
 * 
 * Navigation by life situation, not service categories.
 * Calm, trust-first, context-driven.
 * "I know what to do. I didn't forget anything."
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronRight, Plane, Home, Palmtree, Heart,
  Users, Briefcase, Building, FileText, Globe, Dumbbell,
  Music, ShoppingBag, GraduationCap, Dog, Phone, MessageCircle,
  ArrowRight, Headphones,
} from 'lucide-react';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { IconBadge } from '@/components/ui/IconBadge';
import { VERTICALS } from '@/lib/verticals';
import { VERTICAL_GROUPS, type VerticalGroupItem } from '@/lib/verticalGroups';
import { resolveIcon } from '@/lib/iconMap';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

// ── Life Contexts — primary navigation ────────────────────────────
const LIFE_CONTEXTS = [
  {
    code: 'arrival',
    icon: Plane,
    titleEn: 'Arrival & First Days',
    titleRu: 'Прибытие и первые дни',
    descEn: 'Airport, transport, essentials',
    descRu: 'Аэропорт, трансфер, первый день',
    route: '/life/arrival',
    verticals: ['transfer', 'vehicle', 'insurance'],
  },
  {
    code: 'living',
    icon: Home,
    titleEn: 'Daily Life',
    titleRu: 'Повседневная жизнь',
    descEn: 'Home services, groceries, routines',
    descRu: 'Дом, быт, ежедневные задачи',
    route: '/life/living',
    verticals: ['cleaning', 'restaurant', 'beauty', 'fitness'],
  },
  {
    code: 'leisure',
    icon: Palmtree,
    titleEn: 'Leisure & Experiences',
    titleRu: 'Отдых и впечатления',
    descEn: 'Tours, yachts, activities',
    descRu: 'Туры, яхты, активности',
    route: '/life/leisure',
    verticals: ['experience', 'yacht', 'water_activity', 'event'],
  },
  {
    code: 'health',
    icon: Heart,
    titleEn: 'Health & Safety',
    titleRu: 'Здоровье и безопасность',
    descEn: 'Clinics, insurance, pharmacy',
    descRu: 'Клиники, страховка, аптека',
    route: '/life/health',
    verticals: ['medical', 'insurance'],
  },
  {
    code: 'family',
    icon: Users,
    titleEn: 'Family & Kids',
    titleRu: 'Семья и дети',
    descEn: 'Childcare, schools, activities',
    descRu: 'Няни, школы, детские занятия',
    route: '/life/family',
    verticals: ['babysitter', 'education', 'pet_service'],
  },
  {
    code: 'property',
    icon: Building,
    titleEn: 'Property & Investment',
    titleRu: 'Недвижимость',
    descEn: 'Rent, buy, manage property',
    descRu: 'Аренда, покупка, управление',
    route: '/life/property',
    verticals: ['property'],
  },
  {
    code: 'relocation',
    icon: FileText,
    titleEn: 'Relocation & Legals',
    titleRu: 'Переезд и документы',
    descEn: 'Visa, banking, legal help',
    descRu: 'Виза, банки, юридическая помощь',
    route: '/life/relocation',
    verticals: ['legal'],
  },
  {
    code: 'business',
    icon: Briefcase,
    titleEn: 'Business & Work',
    titleRu: 'Бизнес и работа',
    descEn: 'Coworking, company setup',
    descRu: 'Коворкинг, регистрация компании',
    route: '/life/business',
    verticals: [],
  },
];

// Secondary contexts (collapsible)
const SECONDARY_CONTEXTS = [
  {
    code: 'sports',
    icon: Dumbbell,
    titleEn: 'Sports & Fitness',
    titleRu: 'Спорт и фитнес',
    route: '/life/sports',
  },
  {
    code: 'nightlife',
    icon: Music,
    titleEn: 'Nightlife & Social',
    titleRu: 'Ночная жизнь',
    route: '/life/nightlife',
  },
  {
    code: 'shopping',
    icon: ShoppingBag,
    titleEn: 'Shopping',
    titleRu: 'Шоппинг',
    route: '/market',
  },
  {
    code: 'visa_travel',
    icon: Globe,
    titleEn: 'Visa Run & Travel',
    titleRu: 'Визаран',
    route: '/life/visa_travel',
  },
  {
    code: 'pets',
    icon: Dog,
    titleEn: 'Pet Care',
    titleRu: 'Питомцы',
    route: '/life/pets',
  },
  {
    code: 'education',
    icon: GraduationCap,
    titleEn: 'Education',
    titleRu: 'Образование',
    route: '/life/education',
  },
];

// ── Resolve vertical for search ───────────────────────────────────
// Vertical gradients removed — using flat muted backgrounds

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

// ══════════════════════════════════════════════════════════════════

export default function Discover() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const [searchQuery, setSearchQuery] = useState('');
  const [showMore, setShowMore] = useState(false);

  const handleNav = useCallback((path: string) => {
    triggerHaptic('light');
    navigate(path);
  }, [navigate]);

  // Flatten all verticals for search
  const allItems = useMemo(() => {
    return VERTICAL_GROUPS.flatMap(g =>
      g.items
        .map(item => resolveItem(item, language))
        .filter(Boolean) as NonNullable<ReturnType<typeof resolveItem>>[]
    );
  }, [language]);

  const isSearching = searchQuery.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return { verticals: [] as typeof allItems, contexts: [] as typeof LIFE_CONTEXTS };
    const q = searchQuery.toLowerCase();
    const verticalResults = allItems.filter(item => item.label.toLowerCase().includes(q));
    const contextResults = [...LIFE_CONTEXTS, ...SECONDARY_CONTEXTS].filter(ctx => {
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
          {/* Context matches */}
          {searchResults.contexts?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{isRu ? 'Ситуации' : 'Life situations'}</p>
              {searchResults.contexts.map((ctx) => {
                const Icon = ctx.icon;
                return (
                  <button
                    key={ctx.code}
                    onClick={() => handleNav(ctx.route)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 active:scale-[0.99] transition-all touch-manipulation text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{isRu ? ctx.titleRu : ctx.titleEn}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 ml-auto" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Vertical matches */}
          {searchResults.verticals?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{isRu ? 'Сервисы' : 'Services'}</p>
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

      {/* ── Main Content: Life Contexts ────────────────── */}
      {!isSearching && (
        <div className="space-y-6">
          {/* Greeting / context */}
          <div className="py-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isRu
                ? 'Выберите ситуацию — мы покажем всё, что нужно'
                : 'Choose your situation — we\u2019ll show you everything you need'}
            </p>
          </div>

          {/* Primary Life Contexts */}
          <div className="space-y-2">
            {LIFE_CONTEXTS.map((ctx) => {
              const Icon = ctx.icon;
              const desc = 'descEn' in ctx ? (isRu ? ctx.descRu : ctx.descEn) : undefined;

              return (
                <button
                  key={ctx.code}
                  onClick={() => handleNav(ctx.route)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl",
                    "bg-card border border-border/50",
                    "hover:border-primary/20 hover:shadow-sm",
                    "active:scale-[0.99] transition-all touch-manipulation",
                    "text-left group"
                  )}
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/12 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground leading-tight">
                      {isRu ? ctx.titleRu : ctx.titleEn}
                    </h3>
                    {desc && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {desc}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 group-hover:text-muted-foreground transition-colors" />
                </button>
              );
            })}
          </div>

          {/* More contexts (toggle) */}
          <div>
            <button
              onClick={() => { setShowMore(!showMore); triggerHaptic('light'); }}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-1"
            >
              <span>{isRu ? (showMore ? 'Свернуть' : 'Ещё ситуации') : (showMore ? 'Show less' : 'More situations')}</span>
              <ChevronRight className={cn("w-4 h-4 transition-transform", showMore && "rotate-90")} />
            </button>

            {showMore && (
              <div className="mt-3 space-y-2">
                {SECONDARY_CONTEXTS.map((ctx) => {
                  const Icon = ctx.icon;
                  return (
                    <button
                      key={ctx.code}
                      onClick={() => handleNav(ctx.route)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl",
                        "bg-muted/30 border border-border/30",
                        "hover:bg-muted/50 active:scale-[0.99] transition-all touch-manipulation",
                        "text-left"
                      )}
                    >
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{isRu ? ctx.titleRu : ctx.titleEn}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 ml-auto" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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
