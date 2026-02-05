/**
 * LifeFlowPage - Life Situation resolver page
 * Shows relevant catalog items based on selected life situation
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituations, useResolveLifeSituation } from '@/hooks/useLifeSituations';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, Home, Ship, Car, UtensilsCrossed, Compass, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

// Entity type to icon/route mapping
const ENTITY_CONFIG: Record<string, { icon: LucideIcon; route: string; labelEn: string; labelRu: string }> = {
  property: { icon: Home, route: '/properties', labelEn: 'Properties', labelRu: 'Недвижимость' },
  service: { icon: Package, route: '/services', labelEn: 'Services', labelRu: 'Услуги' },
  yacht: { icon: Ship, route: '/yachts', labelEn: 'Yachts', labelRu: 'Яхты' },
  transport: { icon: Car, route: '/transport', labelEn: 'Transport', labelRu: 'Транспорт' },
  restaurant: { icon: UtensilsCrossed, route: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны' },
  tour: { icon: MapPin, route: '/tours', labelEn: 'Tours', labelRu: 'Туры' },
  experience: { icon: Compass, route: '/experiences', labelEn: 'Experiences', labelRu: 'Впечатления' },
};

export default function LifeFlowPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  const { data: situations } = useLifeSituations();
  const { data: catalogItems, isLoading } = useResolveLifeSituation(code || null);

  const currentSituation = situations?.find((s) => s.code === code);

  // Group items by entity type
  const groupedItems = React.useMemo(() => {
    if (!catalogItems) return {};
    return catalogItems.reduce((acc, item) => {
      if (!acc[item.entity_type]) {
        acc[item.entity_type] = [];
      }
      acc[item.entity_type].push(item);
      return acc;
    }, {} as Record<string, typeof catalogItems>);
  }, [catalogItems]);

  const getIcon = (iconName: string): LucideIcon => {
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || Compass;
  };

  const SituationIcon = currentSituation ? getIcon(currentSituation.icon) : Compass;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center gap-3 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {currentSituation && (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${currentSituation.color}15` }}
                >
                  <SituationIcon
                    className="w-5 h-5"
                    style={{ color: currentSituation.color }}
                  />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">
                    {isRussian ? currentSituation.title_ru : currentSituation.title_en}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {isRussian ? currentSituation.description_ru : currentSituation.description_en}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(groupedItems).length === 0 ? (
            <div className="text-center py-12">
              <Compass className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {isRussian ? 'Пока ничего не найдено' : 'Nothing found yet'}
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                {isRussian
                  ? 'Скоро здесь появятся рекомендации для вашей ситуации'
                  : 'Recommendations for your situation will appear here soon'}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/')}
              >
                {isRussian ? 'На главную' : 'Go Home'}
              </Button>
            </div>
          ) : (
            Object.entries(groupedItems).map(([entityType, items]) => {
              const config = ENTITY_CONFIG[entityType] || {
                icon: Package,
                route: '/',
                labelEn: entityType,
                labelRu: entityType,
              };
              const EntityIcon = config.icon;

              return (
                <section key={entityType} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <EntityIcon className="w-5 h-5 text-primary" />
                      <h2 className="font-semibold">
                        {isRussian ? config.labelRu : config.labelEn}
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        ({items.length})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(config.route)}
                    >
                      {isRussian ? 'Все' : 'All'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {items.slice(0, 6).map((item) => (
                      <button
                        key={item.entity_id}
                        onClick={() => navigate(`${config.route}/${item.entity_id}`)}
                        className={cn(
                          "p-4 rounded-xl border bg-card text-left",
                          "hover:border-primary/30 hover:shadow-sm transition-all"
                        )}
                      >
                        <EntityIcon className="w-6 h-6 text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">
                          {isRussian ? config.labelRu : config.labelEn}
                        </p>
                        <p className="text-sm font-medium truncate">
                          ID: {item.entity_id.slice(0, 8)}...
                        </p>
                        <div className="mt-2 flex items-center gap-1">
                          <div
                            className="h-1.5 rounded-full bg-primary/20"
                            style={{ width: `${item.weight}%` }}
                          >
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${item.weight}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {item.weight}%
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
