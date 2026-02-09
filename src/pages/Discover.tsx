/**
 * Discover Page — Premium tab-based services hub
 * Uses MiniAppLayout search, tabs in stickySubHeader
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Sailboat, Car, Sparkles, ArrowRight, Zap, Shield, Heart, Waves, Scissors, Utensils, Stethoscope, GraduationCap, Scale, PawPrint, Flower2, Plane, Calendar, Dumbbell, Crown } from 'lucide-react';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { IconBadge } from '@/components/ui/IconBadge';
import { VERTICALS } from '@/lib/verticals';
import { VERTICAL_GROUPS, type VerticalGroupItem } from '@/lib/verticalGroups';
import { resolveIcon } from '@/lib/iconMap';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

// ── Gradient map ──────────────────────────────────────────────────
const VERTICAL_GRADIENTS: Record<string, string> = {
  property: 'from-emerald-500 to-teal-400',
  yacht: 'from-blue-500 to-cyan-400',
  vehicle: 'from-violet-500 to-purple-400',
  experience: 'from-fuchsia-500 to-pink-400',
  cleaning: 'from-amber-500 to-orange-400',
  babysitter: 'from-pink-400 to-rose-300',
  beauty: 'from-pink-500 to-fuchsia-400',
  restaurant: 'from-rose-500 to-red-400',
  medical: 'from-teal-500 to-cyan-400',
  legal: 'from-slate-500 to-zinc-400',
  education: 'from-blue-400 to-sky-300',
  fitness: 'from-orange-500 to-amber-400',
  event: 'from-purple-500 to-violet-400',
  water_activity: 'from-cyan-500 to-sky-400',
  pet_service: 'from-orange-400 to-yellow-400',
  flower: 'from-pink-400 to-rose-300',
  insurance: 'from-indigo-500 to-blue-400',
  transfer: 'from-indigo-500 to-violet-400',
};

// ── Featured hero cards with richer visuals ───────────────────────
const FEATURED_SERVICES = [
  {
    id: 'property', icon: Home,
    titleEn: 'Real Estate', titleRu: 'Недвижимость',
    descEn: 'Villas, condos & long-term rental', descRu: 'Виллы, кондо и долгосрок',
    gradient: 'from-emerald-600 via-emerald-500 to-teal-400',
    bgPattern: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
    path: '/properties',
    emoji: '🏡',
  },
  {
    id: 'experience', icon: Sparkles,
    titleEn: 'Things To Do', titleRu: 'Чем заняться',
    descEn: 'Tours, activities & island adventures', descRu: 'Туры и приключения на острове',
    gradient: 'from-fuchsia-600 via-purple-500 to-indigo-400',
    bgPattern: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.12) 0%, transparent 50%)',
    path: '/experiences',
    emoji: '✨',
  },
  {
    id: 'yacht', icon: Sailboat,
    titleEn: 'Yacht Charter', titleRu: 'Яхт-чартер',
    descEn: 'Boats, sunset cruises & parties', descRu: 'Катера, круизы и вечеринки',
    gradient: 'from-sky-600 via-blue-500 to-cyan-400',
    bgPattern: 'radial-gradient(circle at 90% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)',
    path: '/yachts',
    emoji: '⛵',
  },
  {
    id: 'vehicle', icon: Car,
    titleEn: 'Car & Bike', titleRu: 'Аренда авто',
    descEn: 'Cars, scooters & bikes for rent', descRu: 'Авто, скутеры и мото',
    gradient: 'from-violet-600 via-purple-500 to-fuchsia-400',
    bgPattern: 'radial-gradient(circle at 10% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)',
    path: '/vehicles',
    emoji: '🚗',
  },
];

// ── Short descriptions ───────────────────────────────────────────
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

export default function Discover() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

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

  const allItems = useMemo(() => resolvedGroups.flatMap(g => g.resolvedItems), [resolvedGroups]);

  const isSearching = searchQuery.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = searchQuery.toLowerCase();
    return allItems.filter(item => item.label.toLowerCase().includes(q));
  }, [allItems, searchQuery, isSearching]);

  const activeGroup = useMemo(() => {
    if (activeTab === 'all') return null;
    return resolvedGroups.find(g => g.id === activeTab) || null;
  }, [activeTab, resolvedGroups]);

  const isPremiumTab = activeTab === 'premium';

  // Tabs ribbon for stickySubHeader
  const tabsRibbon = !isSearching ? (
    <div className="px-4 py-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide touch-pan-y snap-x snap-proximity">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = resolveIcon(tab.icon);
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all snap-start",
                "active:scale-95 touch-manipulation",
                isActive
                  ? "bg-foreground text-background shadow-lg"
                  : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{isRu ? tab.labelRu : tab.labelEn}</span>
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <MiniAppLayout
      title={isRu ? 'Услуги' : 'Services'}
      subtitle={isRu ? 'Все сервисы' : 'All services'}
      fallbackPath="/"
      showHero={false}
      showCategories={false}
      showFilter={false}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={isRu ? 'Найти услугу...' : 'Search services...'}
      stickySubHeader={tabsRibbon}
    >
      {/* ── Search Results ──────────────────────────────── */}
      {isSearching && (
        <div>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.route)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-muted/50 active:scale-95 transition-all touch-manipulation"
                >
                  <IconBadge icon={item.icon} size="md" variant="gradient" gradient={item.gradient} className="shadow-md" />
                  <span className="text-xs font-medium text-center text-foreground leading-tight line-clamp-2">{item.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {isRu ? 'Ничего не найдено' : 'Nothing found'}
            </div>
          )}
        </div>
      )}

      {/* ── "All" Tab ──────────────────────────────────── */}
      {!isSearching && activeTab === 'all' && (
        <div className="space-y-8">
          {/* Featured Hero Cards */}
          <div className="-mx-4 px-4">
            <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-none" style={{ touchAction: 'pan-x' }}>
              {FEATURED_SERVICES.map((svc) => {
                const Icon = svc.icon;
                return (
                  <button
                    key={svc.id}
                    onClick={() => handleNav(svc.path)}
                    className={cn(
                      'flex-shrink-0 snap-start w-[75%] sm:w-[55%]',
                      'rounded-3xl p-5 relative overflow-hidden',
                      'bg-gradient-to-br text-white',
                      'active:scale-[0.97] transition-transform touch-manipulation',
                      'shadow-xl',
                      svc.gradient
                    )}
                    style={{ minHeight: 130 }}
                  >
                    {/* Decorative circles */}
                    <div className="absolute inset-0" style={{ background: svc.bgPattern }} />
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10" />
                    <div className="absolute -right-2 -top-8 w-16 h-16 rounded-full bg-white/5" />
                    
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div className="flex items-start justify-between">
                        <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-2xl">{svc.emoji}</span>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-base font-bold leading-tight">{isRu ? svc.titleRu : svc.titleEn}</h3>
                        <p className="text-[11px] text-white/70 mt-1 leading-relaxed">{isRu ? svc.descRu : svc.descEn}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compact service grid by group */}
          {resolvedGroups.map((group) => {
            const isPremium = group.id === 'premium';
            return (
              <div key={group.id}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    isPremium ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                  )}>
                    {group.label}
                  </h3>
                  <div className="flex-1 h-px bg-border/50" />
                </div>
                <div className={cn(
                  "grid grid-cols-4 gap-x-2 gap-y-4",
                  isPremium && "bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-950/15 dark:to-orange-950/10 rounded-2xl p-3 border border-amber-200/50 dark:border-amber-800/30"
                )}>
                  {group.resolvedItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.route)}
                      className="flex flex-col items-center gap-1.5 py-1 rounded-xl active:scale-90 transition-transform touch-manipulation group"
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-md transition-shadow group-hover:shadow-lg",
                        item.gradient,
                      )}>
                        {(() => { const I = resolveIcon(item.icon); return <I className="w-5 h-5 text-white" />; })()}
                      </div>
                      <span className="text-[10px] font-medium text-center text-foreground/80 leading-tight line-clamp-2 max-w-[68px]">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Category Tab: 2-col cards ──────────────────── */}
      {!isSearching && activeGroup && !isPremiumTab && (
        <div className="grid grid-cols-2 gap-3">
          {activeGroup.resolvedItems.map((item) => {
            const desc = ITEM_DESCRIPTIONS[item.id];
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.route)}
                className={cn(
                  "relative flex flex-col items-start gap-3 p-4 rounded-2xl overflow-hidden",
                  "bg-card border border-border/40",
                  "hover:shadow-lg active:scale-[0.97] transition-all touch-manipulation",
                  "text-left group"
                )}
              >
                {/* Subtle gradient overlay */}
                <div className={cn("absolute inset-0 opacity-[0.06] bg-gradient-to-br", item.gradient)} />
                <div className="relative z-10">
                  <IconBadge icon={item.icon} size="lg" variant="gradient" gradient={item.gradient} className="shadow-lg" />
                </div>
                <div className="relative z-10 min-w-0">
                  <h3 className="text-sm font-bold text-foreground leading-tight">{item.label}</h3>
                  {desc && (
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {isRu ? desc.ru : desc.en}
                    </p>
                  )}
                </div>
                <ArrowRight className="absolute bottom-3 right-3 w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors" />
              </button>
            );
          })}
        </div>
      )}

      {/* ── Premium Tab ────────────────────────────────── */}
      {!isSearching && isPremiumTab && activeGroup && (
        <div className="space-y-4">
          {activeGroup.resolvedItems.map((item) => {
            const desc = ITEM_DESCRIPTIONS[item.id];
            const isConcierge = item.route === '/vip-concierge';
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.route)}
                className={cn(
                  "w-full relative overflow-hidden flex items-center gap-4 p-6 rounded-3xl",
                  "active:scale-[0.98] transition-all touch-manipulation",
                  "shadow-xl border",
                  isConcierge
                    ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/20 border-amber-200/60 dark:border-amber-700/40"
                    : "bg-gradient-to-br from-rose-50 via-red-50 to-orange-50 dark:from-rose-950/40 dark:via-red-950/30 dark:to-orange-950/20 border-red-200/60 dark:border-red-700/40"
                )}
              >
                {/* Decorative element */}
                <div className={cn(
                  "absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20",
                  isConcierge ? "bg-amber-400" : "bg-red-400"
                )} />
                <div className={cn(
                  "absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-10",
                  isConcierge ? "bg-amber-500" : "bg-red-500"
                )} />

                <IconBadge
                  icon={item.icon}
                  size="xl"
                  variant="gradient"
                  gradient={isConcierge ? 'from-amber-500 to-orange-400' : 'from-red-500 to-rose-400'}
                  className="shadow-xl relative z-10"
                />
                <div className="text-left flex-1 min-w-0 relative z-10">
                  <h3 className="text-lg font-bold text-foreground">{item.label}</h3>
                  {desc && (
                    <p className="text-xs text-muted-foreground mt-0.5">{isRu ? desc.ru : desc.en}</p>
                  )}
                  <div className={cn(
                    "inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full text-xs font-bold",
                    isConcierge
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : "bg-red-500/15 text-red-700 dark:text-red-300"
                  )}>
                    {isRu ? 'Открыть' : 'Explore'}
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </MiniAppLayout>
  );
}
