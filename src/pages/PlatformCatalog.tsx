/**
 * PlatformCatalog — Full map of situations + mini-apps
 * Two-panel layout: situations sidebar (filter) + apps grid
 */
import React, { useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituations } from '@/hooks/useLifeOS';
import { useCategories, Category, CategoryGroup } from '@/hooks/useCategories';
import { CatalogHeader } from '@/components/shared/CatalogHeader';
import { cn } from '@/lib/utils';
import {
  Plane, Home, Palmtree, Heart, Users, Building, Globe, Briefcase,
  PawPrint, GraduationCap, ShoppingBag, Music, Trophy, Stamp,
  Compass, Sun, MapPin, LayoutGrid, Layers,
  type LucideIcon
} from 'lucide-react';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';

// Map situation codes to relevant category slugs
const SITUATION_CATEGORY_MAP: Record<string, string[]> = {
  arrival: ['transport', 'property', 'insurance', 'transfer', 'banking', 'visa'],
  living: ['cleaning', 'services', 'restaurants', 'market', 'fitness', 'medical'],
  leisure: ['yachts', 'water', 'events', 'restaurants', 'experiences', 'beauty'],
  health: ['medical', 'pharmacy', 'fitness', 'insurance'],
  family: ['babysitter', 'education', 'medical', 'events', 'pets'],
  property: ['property', 'services', 'cleaning', 'legal'],
  relocation: ['visa', 'legal', 'banking', 'insurance', 'property', 'transport'],
  business: ['legal', 'banking', 'services', 'market'],
  pets: ['pets', 'veterinary', 'services'],
  education: ['education', 'events'],
  shopping: ['market', 'flowers', 'restaurants'],
  nightlife: ['events', 'restaurants', 'transport'],
  sports: ['fitness', 'water', 'experiences'],
  visa_travel: ['visa', 'insurance', 'transport', 'transfer'],
};

const iconMap: Record<string, LucideIcon> = {
  Plane, Home, Palmtree, Heart, Users, Building, Globe, Briefcase,
  PawPrint, GraduationCap, ShoppingBag, Music, Trophy, Stamp,
  Compass, Sun, MapPin,
};

function resolveIcon(name: string): LucideIcon {
  return iconMap[name] || Compass;
}

export default memo(function PlatformCatalog() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { data: situations, isLoading: sitLoading } = useLifeSituations();
  const { groups, flatCategories, isLoading: catLoading, getName } = useCategories();

  const [activeSituation, setActiveSituation] = useState<string | null>(null);

  // Get all mini-app categories
  const allMiniApps = useMemo(() => {
    return flatCategories.filter(c => c.hasMiniApp);
  }, [flatCategories]);

  // Filter by situation
  const filteredApps = useMemo(() => {
    if (!activeSituation) return allMiniApps;
    const slugs = SITUATION_CATEGORY_MAP[activeSituation] || [];
    return allMiniApps.filter(app =>
      slugs.includes(app.slug) || slugs.includes(app.miniAppType || '')
    );
  }, [allMiniApps, activeSituation]);

  const isLoading = sitLoading || catLoading;

  return (
    <AppLayout showHeader={false}>
    <div className="min-h-screen bg-background">
      <CatalogHeader
        title={isRu ? 'Каталог платформы' : 'Platform Catalog'}
      />

      <div className="max-w-[1536px] mx-auto px-4 lg:px-8 py-6">
        {/* Page intro */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            {isRu ? 'Все сервисы и ситуации' : 'All Services & Situations'}
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base max-w-2xl">
            {isRu
              ? 'Полная карта платформы: выберите жизненную ситуацию, чтобы увидеть релевантные сервисы, или просмотрите все доступные мини-приложения.'
              : 'Full platform map: select a life situation to see relevant services, or browse all available mini-apps.'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Situations */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  {isRu ? 'Ситуации' : 'Situations'}
                </h2>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-11 rounded-none" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {/* "All" button */}
                  <button
                    onClick={() => setActiveSituation(null)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-none text-left transition-all duration-200",
                      !activeSituation
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4 shrink-0" />
                    <span className="text-sm">
                      {isRu ? 'Все сервисы' : 'All services'}
                    </span>
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">
                      {allMiniApps.length}
                    </Badge>
                  </button>

                  {situations?.map(sit => {
                    const Icon = resolveIcon(sit.icon);
                    const count = (SITUATION_CATEGORY_MAP[sit.code] || []).filter(slug =>
                      allMiniApps.some(app => app.slug === slug || app.miniAppType === slug)
                    ).length;

                    return (
                      <button
                        key={sit.id}
                        onClick={() => setActiveSituation(
                          activeSituation === sit.code ? null : sit.code
                        )}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-none text-left transition-all duration-200",
                          activeSituation === sit.code
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-sm truncate">
                          {isRu ? sit.title_ru : sit.title_en}
                        </span>
                        {count > 0 && (
                          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">
                            {count}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* Right: Mini-apps grid */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <LayoutGrid className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                {activeSituation
                  ? (isRu ? 'Релевантные сервисы' : 'Relevant Services')
                  : (isRu ? 'Все мини-приложения' : 'All Mini-Apps')}
              </h2>
              <span className="text-xs text-muted-foreground ml-1">
                ({filteredApps.length})
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-none" />
                ))}
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">
                  {isRu ? 'Нет сервисов для этой ситуации' : 'No services for this situation'}
                </p>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
              >
                <AnimatePresence mode="popLayout">
                  {filteredApps.map(app => {
                    const Icon = app.icon;
                    return (
                      <motion.button
                        key={app.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => navigate(app.path)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2.5 p-5 rounded-none",
                          "bg-card border border-border/50",
                          "hover:shadow-md hover:-translate-y-0.5 hover:border-border",
                          "transition-all duration-200 cursor-pointer group text-center"
                        )}
                      >
                        <div className="w-12 h-12 rounded-none bg-primary/[0.07] flex items-center justify-center group-hover:bg-primary/[0.12] transition-colors">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">
                            {getName(app)}
                          </span>
                          {(app.isNew || app.isHot) && (
                            <div className="mt-1">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-[9px] px-1.5",
                                  app.isNew && "bg-primary/10 text-primary",
                                  app.isHot && "bg-destructive/10 text-destructive"
                                )}
                              >
                                {app.isNew ? (isRu ? 'Новое' : 'New') : (isRu ? 'Популярно' : 'Hot')}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
    </AppLayout>
  );
});
