/**
 * Discover Page — Compact tab-based services hub
 * Tabs filter by category, "All" shows compact 3-col grid, category shows 2-col
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Home, Sailboat, Car, Sparkles, Star, Crown, AlertCircle, ArrowRight } from 'lucide-react';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { Input } from '@/components/ui/input';
import { IconBadge } from '@/components/ui/IconBadge';
import { VERTICALS } from '@/lib/verticals';
import { VERTICAL_GROUPS, type VerticalGroupItem } from '@/lib/verticalGroups';
import { resolveIcon } from '@/lib/iconMap';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

// ── Gradient map ──────────────────────────────────────────────────
const VERTICAL_GRADIENTS: Record<string, string> = {
  property: 'from-emerald-500 to-green-400',
  yacht: 'from-blue-500 to-cyan-400',
  vehicle: 'from-indigo-500 to-violet-400',
  experience: 'from-purple-500 to-indigo-400',
  cleaning: 'from-amber-500 to-yellow-400',
  babysitter: 'from-pink-400 to-rose-300',
  beauty: 'from-pink-500 to-purple-400',
  restaurant: 'from-rose-500 to-pink-400',
  medical: 'from-teal-500 to-emerald-400',
  legal: 'from-slate-500 to-gray-400',
  education: 'from-blue-400 to-indigo-300',
  fitness: 'from-orange-500 to-red-400',
  event: 'from-purple-500 to-indigo-400',
  water_activity: 'from-cyan-500 to-blue-400',
  pet_service: 'from-orange-500 to-amber-400',
  flower: 'from-pink-400 to-rose-300',
  insurance: 'from-slate-500 to-blue-400',
  transfer: 'from-indigo-500 to-blue-400',
};

// ── Featured services for hero carousel ───────────────────────────
const FEATURED_SERVICES = [
  {
    id: 'property', icon: Home,
    titleEn: 'Real Estate', titleRu: 'Недвижимость',
    descEn: 'Villas, condos & long-term', descRu: 'Виллы, кондо и долгосрок',
    gradient: 'from-emerald-500 to-green-400', path: '/properties',
  },
  {
    id: 'experience', icon: Sparkles,
    titleEn: 'Things To Do', titleRu: 'Чем заняться',
    descEn: 'Tours, activities & adventures', descRu: 'Туры, активности и приключения',
    gradient: 'from-purple-500 to-indigo-400', path: '/experiences',
  },
  {
    id: 'yacht', icon: Sailboat,
    titleEn: 'Yacht Charter', titleRu: 'Яхт-чартер',
    descEn: 'Boats, cruises & parties', descRu: 'Катера, круизы и вечеринки',
    gradient: 'from-sky-500 to-blue-400', path: '/yachts',
  },
  {
    id: 'vehicle', icon: Car,
    titleEn: 'Car & Bike Rental', titleRu: 'Аренда авто',
    descEn: 'Cars, scooters & bikes', descRu: 'Авто, скутеры и мото',
    gradient: 'from-indigo-500 to-violet-400', path: '/vehicles',
  },
];

// ── Short descriptions for category view ─────────────────────────
const ITEM_DESCRIPTIONS: Record<string, { en: string; ru: string }> = {
  property: { en: 'Rent & buy villas, condos', ru: 'Аренда и покупка' },
  yacht: { en: 'Charters & boat trips', ru: 'Чартер и морские туры' },
  vehicle: { en: 'Cars, scooters, bikes', ru: 'Авто, скутеры, мото' },
  experience: { en: 'Tours & adventures', ru: 'Туры и приключения' },
  cleaning: { en: 'Home & office cleaning', ru: 'Уборка дома и офиса' },
  babysitter: { en: 'Childcare & nannies', ru: 'Няни и присмотр' },
  beauty: { en: 'Salons & spa', ru: 'Салоны и спа' },
  restaurant: { en: 'Book a table', ru: 'Забронировать столик' },
  medical: { en: 'Clinics & doctors', ru: 'Клиники и врачи' },
  legal: { en: 'Lawyers & visa help', ru: 'Юристы и визы' },
  education: { en: 'Schools & courses', ru: 'Школы и курсы' },
  fitness: { en: 'Gyms & trainers', ru: 'Залы и тренеры' },
  event: { en: 'Events & parties', ru: 'Мероприятия' },
  water_activity: { en: 'Surfing, diving & more', ru: 'Сёрф, дайвинг и др.' },
  pet_service: { en: 'Vets & pet care', ru: 'Ветеринары и уход' },
  flower: { en: 'Bouquets & delivery', ru: 'Букеты и доставка' },
  insurance: { en: 'Health & travel plans', ru: 'Мед. и тревел' },
  transfer: { en: 'Airport & city rides', ru: 'Трансферы' },
};

// ── Tab config ────────────────────────────────────────────────────
const TABS = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🏠' },
  ...VERTICAL_GROUPS.map(g => ({ id: g.id, labelEn: g.labelEn, labelRu: g.labelRu, icon: g.icon })),
];

// ── Resolve vertical group item ───────────────────────────────────
function resolveItem(item: VerticalGroupItem, language: string) {
  if (item.verticalId) {
    const v = Object.values(VERTICALS).find(v => v.id === item.verticalId);
    if (!v) return null;
    return {
      id: v.id,
      icon: v.icon,
      label: language === 'ru' ? v.labelRu : v.labelEn,
      route: `/${v.plural}`,
      gradient: VERTICAL_GRADIENTS[v.id] || 'from-primary to-accent',
    };
  }
  return {
    id: item.route || '',
    icon: item.icon || '📦',
    label: language === 'ru' ? (item.labelRu || '') : (item.labelEn || ''),
    route: item.route || '/',
    gradient: 'from-gray-500 to-gray-400',
  };
}

// ══════════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════════

export default function Discover() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleNav = useCallback((path: string) => {
    triggerHaptic('light');
    navigate(path);
  }, [navigate]);

  const handleTabChange = useCallback((tabId: string) => {
    triggerHaptic('light');
    setActiveTab(tabId);
  }, []);

  // Resolve all groups
  const resolvedGroups = useMemo(() => {
    return VERTICAL_GROUPS.map(group => ({
      ...group,
      label: isRu ? group.labelRu : group.labelEn,
      resolvedItems: group.items
        .map(item => resolveItem(item, language))
        .filter(Boolean) as NonNullable<ReturnType<typeof resolveItem>>[],
    }));
  }, [language, isRu]);

  // All items flat
  const allItems = useMemo(() => resolvedGroups.flatMap(g => g.resolvedItems), [resolvedGroups]);

  // Filter by search
  const isSearching = searchQuery.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = searchQuery.toLowerCase();
    return allItems.filter(item => item.label.toLowerCase().includes(q));
  }, [allItems, searchQuery, isSearching]);

  // Get items for selected tab
  const activeGroup = useMemo(() => {
    if (activeTab === 'all') return null;
    return resolvedGroups.find(g => g.id === activeTab) || null;
  }, [activeTab, resolvedGroups]);

  const isPremiumTab = activeTab === 'premium';

  return (
    <MiniAppLayout
      title={isRu ? 'Услуги' : 'Services'}
      subtitle={isRu ? 'Все сервисы для жизни' : 'All services for your life'}
      fallbackPath="/"
      showHero={false}
      showCategories={false}
      showFilter={false}
    >
      {/* Sticky Search + Tabs */}
      <div className="sticky top-0 z-30 -mx-4 px-4 pt-3 pb-2 bg-background/95 backdrop-blur-sm border-b border-border/30 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Найти услугу...' : 'Search services...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted/50 border-border/50"
          />
        </div>

        {/* Tabs — hidden when searching */}
        {!isSearching && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide touch-pan-y -mx-1 px-1 pb-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = resolveIcon(tab.icon);
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                    "active:scale-95 touch-manipulation",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{isRu ? tab.labelRu : tab.labelEn}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <PullToRefresh onRefresh={handleRefresh} className="min-h-0">
        <div key={refreshKey} className="pb-24 pt-4">

          {/* ── Search Results ──────────────────────────────── */}
          {isSearching && (
            <div className="space-y-2">
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.route)}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-muted/50 active:scale-95 transition-all touch-manipulation"
                    >
                      <IconBadge icon={item.icon} size="md" variant="gradient" gradient={item.gradient} className="shadow-sm" />
                      <span className="text-xs font-medium text-center text-foreground leading-tight line-clamp-2">{item.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {isRu ? 'Ничего не найдено' : 'Nothing found'}
                </div>
              )}
            </div>
          )}

          {/* ── "All" Tab: Featured + Compact Grid ─────────── */}
          {!isSearching && activeTab === 'all' && (
            <div className="space-y-6">
              {/* Featured Strip */}
              <div className="-mx-4 px-4">
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none" style={{ touchAction: 'pan-x' }}>
                  {FEATURED_SERVICES.map((svc) => {
                    const Icon = svc.icon;
                    return (
                      <button
                        key={svc.id}
                        onClick={() => handleNav(svc.path)}
                        className={cn(
                          'flex-shrink-0 snap-start w-[68%] sm:w-[50%]',
                          'rounded-2xl p-4 flex items-center gap-3',
                          'bg-gradient-to-br text-white shadow-lg',
                          'active:scale-[0.97] transition-transform touch-manipulation',
                          svc.gradient
                        )}
                        style={{ minHeight: 100 }}
                      >
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left min-w-0">
                          <h3 className="text-sm font-bold leading-tight truncate">{isRu ? svc.titleRu : svc.titleEn}</h3>
                          <p className="text-[11px] text-white/75 mt-0.5 line-clamp-1">{isRu ? svc.descRu : svc.descEn}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Compact 3-col grids by group */}
              {resolvedGroups.map((group) => {
                const isPremium = group.id === 'premium';
                return (
                  <div key={group.id}>
                    <h3 className={cn(
                      "text-[11px] font-semibold uppercase tracking-widest mb-2 px-1",
                      isPremium ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/70"
                    )}>
                      {group.label}
                    </h3>
                    <div className={cn(
                      "grid grid-cols-3 gap-1",
                      isPremium && "bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-950/10 dark:to-yellow-950/10 rounded-2xl p-2"
                    )}>
                      {group.resolvedItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNav(item.route)}
                          className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-muted/50 active:scale-95 transition-all touch-manipulation"
                        >
                          <IconBadge icon={item.icon} size="md" variant="gradient" gradient={item.gradient} className="shadow-sm" />
                          <span className="text-[11px] font-medium text-center text-foreground leading-tight line-clamp-2">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Category Tab: 2-col grid ───────────────────── */}
          {!isSearching && activeGroup && !isPremiumTab && (
            <div className="grid grid-cols-2 gap-3">
              {activeGroup.resolvedItems.map((item) => {
                const desc = ITEM_DESCRIPTIONS[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.route)}
                    className={cn(
                      "flex flex-col items-start gap-3 p-4 rounded-2xl border border-border/50",
                      "bg-gradient-to-br from-card to-muted/30",
                      "hover:shadow-md active:scale-[0.97] transition-all touch-manipulation",
                      "text-left"
                    )}
                  >
                    <IconBadge icon={item.icon} size="lg" variant="gradient" gradient={item.gradient} className="shadow-md" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground leading-tight">{item.label}</h3>
                      {desc && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {isRu ? desc.ru : desc.en}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Premium Tab: full-width accent cards ───────── */}
          {!isSearching && isPremiumTab && activeGroup && (
            <div className="space-y-3">
              {activeGroup.resolvedItems.map((item) => {
                const desc = ITEM_DESCRIPTIONS[item.id];
                const isConcierge = item.route === '/vip-concierge';
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.route)}
                    className={cn(
                      "w-full flex items-center gap-4 p-5 rounded-2xl",
                      "bg-gradient-to-r shadow-lg",
                      "active:scale-[0.98] transition-all touch-manipulation",
                      isConcierge
                        ? "from-amber-100 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-800/40"
                        : "from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border border-red-200 dark:border-red-800/40"
                    )}
                  >
                    <IconBadge
                      icon={item.icon}
                      size="xl"
                      variant="gradient"
                      gradient={isConcierge ? 'from-amber-500 to-yellow-400' : 'from-red-500 to-orange-400'}
                      className="shadow-lg"
                    />
                    <div className="text-left flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground">{item.label}</h3>
                      {desc && (
                        <p className="text-xs text-muted-foreground mt-0.5">{isRu ? desc.ru : desc.en}</p>
                      )}
                      <div className={cn(
                        "inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-medium",
                        isConcierge
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : "bg-red-500/10 text-red-700 dark:text-red-400"
                      )}>
                        {isRu ? 'Открыть' : 'Open'}
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

        </div>
      </PullToRefresh>
    </MiniAppLayout>
  );
}
