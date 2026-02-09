/**
 * Discover Page — Services Hub with visual hierarchy
 * Featured strip → iOS-style grouped lists → Premium accent
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Home, Sailboat, Car, Sparkles, Star, Crown, AlertCircle } from 'lucide-react';
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

// ── Gradient map for icon badges ──────────────────────────────────
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
    id: 'property',
    icon: Home,
    titleEn: 'Real Estate',
    titleRu: 'Недвижимость',
    descEn: 'Villas, condos & long-term',
    descRu: 'Виллы, кондо и долгосрок',
    gradient: 'from-emerald-500 to-green-400',
    path: '/properties',
  },
  {
    id: 'experience',
    icon: Sparkles,
    titleEn: 'Things To Do',
    titleRu: 'Чем заняться',
    descEn: 'Tours, activities & adventures',
    descRu: 'Туры, активности и приключения',
    gradient: 'from-purple-500 to-indigo-400',
    path: '/experiences',
  },
  {
    id: 'yacht',
    icon: Sailboat,
    titleEn: 'Yacht Charter',
    titleRu: 'Яхт-чартер',
    descEn: 'Boats, cruises & parties',
    descRu: 'Катера, круизы и вечеринки',
    gradient: 'from-sky-500 to-blue-400',
    path: '/yachts',
  },
  {
    id: 'vehicle',
    icon: Car,
    titleEn: 'Car & Bike Rental',
    titleRu: 'Аренда авто',
    descEn: 'Cars, scooters & bikes',
    descRu: 'Авто, скутеры и мото',
    gradient: 'from-indigo-500 to-violet-400',
    path: '/vehicles',
  },
];

// ── Group header icons ────────────────────────────────────────────
const GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  transport: Car,
  home: Home,
  leisure: Star,
  health: AlertCircle,
  premium: Crown,
};

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
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleNav = useCallback((path: string) => {
    triggerHaptic('light');
    navigate(path);
  }, [navigate]);

  // Resolve groups
  const resolvedGroups = useMemo(() => {
    return VERTICAL_GROUPS.map(group => ({
      ...group,
      label: isRu ? group.labelRu : group.labelEn,
      resolvedItems: group.items
        .map(item => resolveItem(item, language))
        .filter(Boolean) as NonNullable<ReturnType<typeof resolveItem>>[],
    }));
  }, [language, isRu]);

  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return resolvedGroups;
    const q = searchQuery.toLowerCase();
    return resolvedGroups
      .map(group => ({
        ...group,
        resolvedItems: group.resolvedItems.filter(item =>
          item.label.toLowerCase().includes(q)
        ),
      }))
      .filter(group => group.resolvedItems.length > 0);
  }, [resolvedGroups, searchQuery]);

  const showFeatured = !searchQuery.trim();

  return (
    <MiniAppLayout
      title={isRu ? 'Услуги' : 'Services'}
      subtitle={isRu ? 'Все сервисы для жизни' : 'All services for your life'}
      fallbackPath="/"
      showHero={false}
      showCategories={false}
      showFilter={false}
    >
      {/* Sticky Search */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Найти услугу...' : 'Search services...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted/50 border-border/50"
          />
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh} className="min-h-0">
        <div key={refreshKey} className="space-y-5 pb-24 pt-4">

          {/* ── Featured Strip ──────────────────────────────── */}
          {showFeatured && (
            <div className="-mx-4 px-4">
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none"
                style={{ touchAction: 'pan-x' }}
              >
                {FEATURED_SERVICES.map((svc) => {
                  const Icon = svc.icon;
                  return (
                    <button
                      key={svc.id}
                      onClick={() => handleNav(svc.path)}
                      className={cn(
                        'flex-shrink-0 snap-start w-[72%] sm:w-[55%]',
                        'rounded-2xl p-4 flex items-center gap-4',
                        'bg-gradient-to-br text-white shadow-lg',
                        'active:scale-[0.97] transition-transform touch-manipulation',
                        svc.gradient
                      )}
                      style={{ minHeight: 110 }}
                    >
                      <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-left min-w-0">
                        <h3 className="text-base font-bold leading-tight truncate">
                          {isRu ? svc.titleRu : svc.titleEn}
                        </h3>
                        <p className="text-xs text-white/80 mt-0.5 line-clamp-2">
                          {isRu ? svc.descRu : svc.descEn}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/60 flex-shrink-0 ml-auto" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Service Groups ─────────────────────────────── */}
          {filteredGroups.map((group) => {
            const isPremium = group.id === 'premium';
            const GroupIcon = GROUP_ICONS[group.id];

            return (
              <section key={group.id}>
                {/* Group header */}
                <div className="flex items-center gap-2 mb-2 px-0.5">
                  {GroupIcon && (
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center",
                      isPremium
                        ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}>
                      <GroupIcon className="w-4 h-4" />
                    </div>
                  )}
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </h2>
                </div>

                {/* Service list card */}
                <div className={cn(
                  "rounded-2xl border overflow-hidden",
                  isPremium
                    ? "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800/40"
                    : "bg-card border-border"
                )}>
                  <div className="divide-y divide-border/50">
                    {group.resolvedItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNav(item.route)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3",
                          "hover:bg-muted/50 active:bg-muted transition-colors",
                          "touch-manipulation active:scale-[0.99]"
                        )}
                      >
                        <IconBadge
                          icon={item.icon}
                          size="sm"
                          variant="gradient"
                          gradient={item.gradient}
                          className="shadow-sm"
                        />
                        <span className="text-sm font-medium text-foreground text-left flex-1 truncate">
                          {item.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}

          {filteredGroups.length === 0 && searchQuery && (
            <div className="text-center py-12 text-muted-foreground">
              {isRu ? 'Ничего не найдено' : 'Nothing found'}
            </div>
          )}
        </div>
      </PullToRefresh>
    </MiniAppLayout>
  );
}
